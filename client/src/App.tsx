import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Agents from "./pages/Agents";
import Quests from "./pages/Quests";
import QuestDetail from "./pages/QuestDetail";
import Monitoring from "./pages/Monitoring";
import Sandbox from "./pages/Sandbox";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Intervention from "./pages/Intervention";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/agents" component={Agents} />
      <Route path="/quests" component={Quests} />
      <Route path="/quests/:id" component={QuestDetail} />
      <Route path="/monitoring" component={Monitoring} />
      <Route path="/sandbox" component={Sandbox} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={Admin} />
      <Route path="/intervention" component={Intervention} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
