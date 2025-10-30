import React, { useEffect } from "react";

export default function TestReact() {
  useEffect(() => {
    console.log("✅ React useEffect chạy OK");
  }, []);
  return <div>React hoạt động bình thường</div>;
}
