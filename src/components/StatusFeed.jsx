import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./StatusFeed.css";

export function StatusFeed() {
  const [statuses, setStatuses] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function fetchStatuses() {
      const { data, error } = await supabase
        .from("statuses")
        .select(`
          id, title, content, image_url, created_at,
          stories ( id, title, slug )
        `)
        .order("created_at", { ascending: false });

      if (!error) setStatuses(data);
    }
    fetchStatuses();
  }, []);

  return (
    <div className="status-feed">
      <h2 className="feed-title">Bảng tin mới nhất</h2>

      {statuses.map((s) => (
        <div key={s.id} className="status-card">
          {s.image_url && (
            <img src={s.image_url} alt={s.title} className="status-img" />
          )}
          <div className="status-body">
            <h3>{s.title}</h3>
            <p className="status-content">
              {expanded === s.id ? s.content : s.content.slice(0, 180) + (s.content.length > 180 ? "..." : "")}
            </p>

            <div className="status-footer">
              {s.content.length > 180 && (
                <button
                  className="btn-viewmore"
                  onClick={() =>
                    setExpanded(expanded === s.id ? null : s.id)
                  }
                >
                  {expanded === s.id ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
              {s.stories && s.stories[0] && (
                <a
                  href={`/story/${s.stories[0].slug}`}
                  className="btn-story"
                >
                  Đọc truyện
                </a>
              )}
            </div>

            <p className="status-time">
              {new Date(s.created_at).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
