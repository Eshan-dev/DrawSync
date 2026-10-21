import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BoardProvider from "../../store/BoardProvider";
import ToolboxProvider from "../../store/ToolboxProvider";
import Toolbar from "../Toolbar";
import Board from "../Board";
import Toolbox from "../Toolbox";
import { io } from 'socket.io-client';
import rough from "roughjs";
import { TOOL_ITEMS } from "../../constants";
import { reconstructElement } from "../../utils/element";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3030";
const socket = io(API_BASE);

export function DrawPage() {
    const { canvasId } = useParams();
    const navigate = useNavigate();
    const { accessToken, doRefresh } = useAuth();

    const [canvas, setCanvas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /**
     * Authenticated fetch with automatic token refresh on 403.
     */
    const authFetch = useCallback(
        async (url, options = {}) => {
            const makeRequest = async (token) => {
                return fetch(url, {
                    ...options,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        ...(options.headers || {}),
                    },
                });
            };

            let res = await makeRequest(accessToken);

            if (res.status === 403) {
                const newToken = await doRefresh();
                if (newToken) {
                    res = await makeRequest(newToken);
                }
            }

            return res;
        },
        [accessToken, doRefresh]
    );

    /**
     * Load the canvas from the backend on mount and listen for socket updates.
     */
    useEffect(() => {
        if (!canvasId) return;

        setLoading(true);
        setError("");

        const token = accessToken || localStorage.getItem("access_token");
        socket.emit("join-canvas", { canvasId, token });

        const onError = (message) => {
            setError(message || "Could not load canvas.");
            setLoading(false);
        };

        const onElements = (elements) => {
            // console.log("elements recieved", elements);
            setCanvas(elements);
            setLoading(false);
        };

        const onDisconnect = (reason) => {
            // If the server forced the disconnect, it means auth failed
            if (reason === 'io server disconnect') {
                setError("Access denied. You are not authorized to view this canvas.");
                setLoading(false);
            }
        };

        socket.on('error', onError);
        socket.on('recieve-elements', onElements);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('error', onError);
            socket.off('recieve-elements', onElements);
            socket.off('disconnect', onDisconnect);
        };
    }, [canvasId, accessToken]);

    /**
     * Redraw the canvas whenever canvas is updated.
     */
    useEffect(() => {
        if (!canvas) return;

        const canvasElement = document.getElementById("canvas");
        if (!canvasElement) return;

        const context = canvasElement.getContext("2d");
        if (!context) return;

        // Clear previous drawings on the canvas
        context.clearRect(0, 0, canvasElement.width, canvasElement.height);

        const roughCanvas = rough.canvas(canvasElement);
        const elementsList = Array.isArray(canvas) ? canvas : (canvas.elements || []);

        elementsList.forEach((rawElement) => {
            let element = rawElement;
            try {
                if (!element.roughEle && !(element.type === TOOL_ITEMS.BRUSH && element.path)) {
                    element = reconstructElement(rawElement);
                }
            } catch (err) {
                console.error("Error reconstructing element:", err);
                return;
            }

            switch (element.type) {
                case TOOL_ITEMS.LINE:
                case TOOL_ITEMS.RECTANGLE:
                case TOOL_ITEMS.CIRCLE:
                case TOOL_ITEMS.ARROW:
                    if (element.roughEle) {
                        roughCanvas.draw(element.roughEle);
                    }
                    break;
                case TOOL_ITEMS.BRUSH:
                    if (element.path) {
                        context.save();
                        context.fillStyle = element.stroke;
                        context.fill(element.path);
                        context.restore();
                    }
                    break;
                case TOOL_ITEMS.TEXT:
                    context.save();
                    context.textBaseline = "top";
                    context.font = `${element.size}px Caveat`;
                    context.fillStyle = element.stroke;
                    context.fillText(element.text || "", element.x1, element.y1);
                    context.restore();
                    break;
                default:
                    break;
            }
        });
    }, [canvas]);

    // ── Loading state ──
    if (loading) {
        return (
            <div style={overlayStyle}>
                <div style={cardStyle}>
                    <div style={spinnerStyle} />
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
                        Loading canvas…
                    </span>
                </div>
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div style={overlayStyle}>
                <div style={{ ...cardStyle, maxWidth: 420, textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚠️</div>
                    <h2 style={{ color: "#fca5a5", margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700 }}>
                        Failed to Load Canvas
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", margin: "0 0 24px", lineHeight: 1.5 }}>
                        {error}
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <button onClick={() => navigate("/dashboard")} style={secondaryBtnStyle}>
                            ← Dashboard
                        </button>
                        <button onClick={() => window.location.reload()} style={primaryBtnStyle}>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Canvas loaded ──
    return (
        <>
            <BoardProvider
                initialElements={Array.isArray(canvas) ? canvas : (canvas?.elements || [])}
                canvasId={canvasId}
                authFetch={authFetch}
            >
                <ToolboxProvider>
                    <button
                        onClick={() => navigate("/dashboard")}
                        style={backBtnStyle}
                        title="Back to Dashboard"
                    >
                        ← Dashboard
                    </button>
                    {canvas && canvas.name && (
                        <div style={canvasNameStyle}>
                            🖼️ {canvas.name}
                        </div>
                    )}
                    <Toolbar />
                    <Board canvasId={canvasId} />
                    <Toolbox />
                </ToolboxProvider>
            </BoardProvider>
        </>
    );
}

// ── Inline styles ──

const overlayStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    fontFamily: "'Inter', sans-serif",
};

const cardStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "40px 36px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
};

const spinnerStyle = {
    width: 36,
    height: 36,
    border: "3px solid rgba(255,255,255,0.12)",
    borderTopColor: "#c084fc",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
};

const backBtnStyle = {
    position: "fixed",
    top: 16,
    left: 16,
    zIndex: 1000,
    background: "rgba(30, 25, 60, 0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.8)",
    padding: "8px 18px",
    borderRadius: 10,
    fontFamily: "Inter, sans-serif",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
};

const canvasNameStyle = {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    background: "rgba(30, 25, 60, 0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.75)",
    padding: "8px 20px",
    borderRadius: 10,
    fontFamily: "Inter, sans-serif",
    fontSize: "0.82rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 300,
};

const primaryBtnStyle = {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #7b2ff7, #f857a6)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(123,47,247,0.4)",
};

const secondaryBtnStyle = {
    padding: "10px 24px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
};