import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./CanvasDashboard.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3030";

/* ── Inline SVG icons ── */
const IconPen = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const IconCanvas = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const IconShare = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.59 13.51 6.83 3.98" />
    <path d="m15.41 6.51-6.82 3.98" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 2.5 }}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const IconEmpty = () => (
  <svg viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <path d="m9 15 3-3 3 3" />
    <path d="M12 12v6" />
  </svg>
);

export function CanvasDashboard() {
  const navigate = useNavigate();
  const { user, accessToken, logout, doRefresh } = useAuth();

  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [shareTarget, setShareTarget] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);

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

  const fetchCanvases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/canvas`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to load canvases (${res.status})`);
      }

      const data = await res.json();
      setCanvases(data);
    } catch (err) {
      setError(err.message || "Could not load canvases. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  const handleCreate = async () => {
    const name = newCanvasName.trim();
    if (!name) {
      setError("Canvas name cannot be empty.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/canvas`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to create canvas.");
      }

      setSuccess(`Canvas "${name}" created successfully.`);
      setShowCreateModal(false);
      setNewCanvasName("");
      await fetchCanvases();
    } catch (err) {
      setError(err.message || "Could not create canvas. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/canvas/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete canvas.");
      }

      setSuccess(`Canvas "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      await fetchCanvases();
    } catch (err) {
      setError(err.message || "Could not delete canvas. Please try again.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const email = shareEmail.trim();
    if (!email || !shareTarget) {
      setError("Please enter an email address.");
      return;
    }

    setSharing(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/canvas/share`, {
        method: "POST",
        body: JSON.stringify({ canvasId: shareTarget.id, shareWithEmail: email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to share canvas.");
      }

      setSuccess(`Canvas "${shareTarget.name}" shared with ${email}.`);
      setShareTarget(null);
      setShareEmail("");
    } catch (err) {
      setError(err.message || "Could not share canvas. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  const openCanvas = (canvasId) => {
    navigate(`/draw/${canvasId}`);
  };

  const isOwner = (canvas) => {
    if (!user) return false;
    const ownerId = typeof canvas.owner === "object" ? canvas.owner._id : canvas.owner;
    return ownerId === user.id || ownerId === user._id;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="dashboard-bg">
      {/* Top bar */}
      <div className="dashboard-topbar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-icon"><IconPen /></span>
          <h1 className="dashboard-brand-text">DrawSync</h1>
        </div>
        <div className="dashboard-user-section">
          {user && (
            <span className="dashboard-greeting">
              Welcome, <strong>{user.name || user.email}</strong>
            </span>
          )}
          <button
            id="btn-logout"
            className="dashboard-logout-btn"
            onClick={() => {
              logout();
              navigate("/auth");
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-card">
        {/* Header */}
        <div className="dashboard-header">
          <h2 className="dashboard-title">
            Your Canvases
            {!loading && (
              <span className="dashboard-count">{canvases.length}</span>
            )}
          </h2>
          <button
            id="btn-open-create-modal"
            className="dashboard-create-btn"
            onClick={() => {
              setShowCreateModal(true);
              setNewCanvasName("");
              setError("");
            }}
          >
            <IconPlus />
            New Canvas
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="dashboard-alert dashboard-alert-error" role="alert">
            {error}
            <button
              className="dashboard-alert-dismiss"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              &#x2715;
            </button>
          </div>
        )}
        {success && (
          <div className="dashboard-alert dashboard-alert-success" role="alert">
            {success}
            <button
              className="dashboard-alert-dismiss"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success"
            >
              &#x2715;
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="dashboard-loading">
            <div className="dashboard-spinner" />
            <span className="dashboard-loading-text">Loading canvases...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && canvases.length === 0 && (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">
              <IconEmpty />
            </div>
            <h3 className="dashboard-empty-title">No canvases yet</h3>
            <p className="dashboard-empty-text">
              Create your first canvas to start drawing and collaborating with others.
            </p>
            <button
              id="btn-empty-create"
              className="dashboard-empty-btn"
              onClick={() => {
                setShowCreateModal(true);
                setNewCanvasName("");
                setError("");
              }}
            >
              <IconPlus />
              Create Your First Canvas
            </button>
          </div>
        )}

        {/* Canvas grid */}
        {!loading && canvases.length > 0 && (
          <div className="dashboard-grid">
            {canvases.map((canvas, index) => (
              <div
                className="canvas-card"
                key={canvas._id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="canvas-card-top">
                  <div className="canvas-card-icon">
                    <IconCanvas />
                  </div>
                  <span
                    className={`canvas-card-badge ${isOwner(canvas) ? "owner" : "shared"
                      }`}
                  >
                    {isOwner(canvas) ? "Owner" : "Shared"}
                  </span>
                </div>

                <h3 className="canvas-card-name" title={canvas.name}>
                  {canvas.name}
                </h3>
                <p className="canvas-card-date">
                  {formatDate(canvas.updatedAt || canvas.createdAt)}
                </p>

                <div className="canvas-card-actions">
                  <button
                    id={`btn-open-canvas-${canvas._id}`}
                    className="canvas-card-open-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCanvas(canvas._id);
                    }}
                  >
                    Open
                  </button>
                  {isOwner(canvas) && (
                    <button
                      id={`btn-share-canvas-${canvas._id}`}
                      className="canvas-card-share-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareTarget({ id: canvas._id, name: canvas.name });
                        setShareEmail("");
                        setError("");
                      }}
                      title="Share canvas"
                    >
                      <IconShare />
                    </button>
                  )}
                  {isOwner(canvas) && (
                    <button
                      id={`btn-delete-canvas-${canvas._id}`}
                      className="canvas-card-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: canvas._id, name: canvas.name });
                      }}
                      title="Delete canvas"
                    >
                      <IconTrash />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Canvas Modal */}
      {showCreateModal && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => !creating && setShowCreateModal(false)}
        >
          <div
            className="dashboard-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create New Canvas</h2>
            <input
              id="input-canvas-name"
              className="dashboard-modal-input"
              type="text"
              placeholder="Enter canvas name..."
              value={newCanvasName}
              onChange={(e) => setNewCanvasName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creating) handleCreate();
              }}
              autoFocus
              maxLength={100}
            />
            <div className="dashboard-modal-actions">
              <button
                id="btn-cancel-create"
                className="dashboard-modal-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-create"
                className="dashboard-modal-confirm"
                onClick={handleCreate}
                disabled={creating || !newCanvasName.trim()}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="dashboard-confirm-overlay"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="dashboard-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Canvas</h3>
            <p>
              Are you sure you want to delete{" "}
              <span className="canvas-name-highlight">"{deleteTarget.name}"</span>?
              <br />
              This action cannot be undone.
            </p>
            <div className="dashboard-confirm-actions">
              <button
                id="btn-cancel-delete"
                className="dashboard-confirm-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                className="dashboard-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Canvas Modal */}
      {shareTarget && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => !sharing && setShareTarget(null)}
        >
          <div
            className="dashboard-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Share Canvas</h2>
            <p className="share-modal-subtitle">
              Share <span className="canvas-name-highlight">"{shareTarget.name}"</span> with another user
            </p>
            <input
              id="input-share-email"
              className="dashboard-modal-input"
              type="email"
              placeholder="Enter email address..."
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !sharing) handleShare();
              }}
              autoFocus
            />
            <div className="dashboard-modal-actions">
              <button
                id="btn-cancel-share"
                className="dashboard-modal-cancel"
                onClick={() => setShareTarget(null)}
                disabled={sharing}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-share"
                className="dashboard-modal-confirm share-confirm-btn"
                onClick={handleShare}
                disabled={sharing || !shareEmail.trim()}
              >
                {sharing ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
