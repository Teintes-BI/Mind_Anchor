import { NavLink, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { TasksPage } from "./pages/TasksPage";
import { InboxPage } from "./pages/InboxPage";
import { AgentLabPage } from "./pages/AgentLabPage";
import { StatePage } from "./pages/StatePage";
import { ReflectionsPage } from "./pages/ReflectionsPage";
import { RecoveryPage } from "./pages/RecoveryPage";
import { CoachPage } from "./pages/CoachPage";
import { WayfinderPage } from "./pages/WayfinderPage";
import { DecisionLedgerPage } from "./pages/DecisionLedgerPage";
import { SingleBrainPage } from "./pages/SingleBrainPage";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/coach", label: "Coach" },
  { to: "/single-brain", label: "Single Brain" },
  { to: "/wayfinder", label: "Wayfinder" },
  { to: "/wayfinder/ledger", label: "选择账本" },
  { to: "/tasks", label: "GoalFlow" },
  { to: "/inbox", label: "收件箱" },
  { to: "/state", label: "状态趋势" },
  { to: "/recovery", label: "恢复" },
  { to: "/reflections", label: "复盘" },
  { to: "/agents", label: "Agent Lab" },
];

export default function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">MindAnchor 控制台</p>
          <h1>个人执行驾驶舱</h1>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="pill">大脑：OpenClaw Cluster</span>
          <span className="pill">客户端：轻量入口 / 出口</span>
        </div>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/single-brain" element={<SingleBrainPage />} />
          <Route path="/wayfinder" element={<WayfinderPage />} />
          <Route path="/wayfinder/ledger" element={<DecisionLedgerPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/state" element={<StatePage />} />
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route path="/reflections" element={<ReflectionsPage />} />
          <Route path="/agents" element={<AgentLabPage />} />
        </Routes>
      </main>
    </div>
  );
}
