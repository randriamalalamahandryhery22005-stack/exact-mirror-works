import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotificationsProvider from "@/contexts/NotificationsProvider";
import { CallProvider } from "@/contexts/CallContext";
import GlobalCallRoot from "@/components/GlobalCallRoot";
import ForceUpdateOverlay from "@/components/ForceUpdateOverlay";
import TrialOverlay from "@/components/TrialOverlay";
import { RequireAuth, RequireAdmin, RedirectIfAuthed } from "@/components/RouteGuards";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";

import Games from "./pages/Games.tsx";
import Admin from "./pages/Admin.tsx";
import Aviator from "./pages/Aviator.tsx";
import AviatorBasic from "./pages/AviatorBasic.tsx";
import AviatorPremium from "./pages/AviatorPremium.tsx";
import AviatorStudio from "./pages/AviatorStudio.tsx";
import AviatorSpribe from "./pages/AviatorSpribe.tsx";
import CosmoX from "./pages/CosmoX.tsx";
import Virtuel from "./pages/Virtuel.tsx";
import JetX from "./pages/JetX.tsx";
import PenaltyShootout from "./pages/PenaltyShootout.tsx";
import NotFound from "./pages/NotFound.tsx";
import CustomPrediction from "./pages/CustomPrediction.tsx";
import Premium from "./pages/Premium.tsx";
import PremiumSelect from "./pages/PremiumSelect.tsx";
import GenStore from "./pages/GenStore.tsx";
import Profile from "./pages/Profile.tsx";
import AnalyseRound from "./pages/AnalyseRound.tsx";
import Chat from "./pages/Chat.tsx";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CallProvider>
          <NotificationsProvider>
          <ForceUpdateOverlay />
          <GlobalCallRoot />
          <TrialOverlay />


          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/index" element={<Index />} />
            <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
            <Route path="/signup" element={<RedirectIfAuthed><Signup /></RedirectIfAuthed>} />

            <Route path="/games" element={<RequireAuth><Games /></RequireAuth>} />
            <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
            <Route path="/aviator" element={<RequireAuth><Aviator /></RequireAuth>} />
            <Route path="/aviator/basic" element={<RequireAuth><AviatorBasic /></RequireAuth>} />
            <Route path="/aviator/pro" element={<RequireAuth><AviatorPremium /></RequireAuth>} />
            <Route path="/aviator-premium" element={<RequireAuth><AviatorPremium /></RequireAuth>} />
            <Route path="/aviator-studio" element={<RequireAuth><AviatorStudio /></RequireAuth>} />
            <Route path="/aviator-spribe" element={<RequireAuth><AviatorSpribe /></RequireAuth>} />
            <Route path="/cosmox" element={<RequireAuth><CosmoX /></RequireAuth>} />
            <Route path="/virtuel" element={<RequireAuth><Virtuel /></RequireAuth>} />
            <Route path="/jetx" element={<RequireAuth><JetX /></RequireAuth>} />
            <Route path="/penalty-shootout" element={<RequireAuth><PenaltyShootout /></RequireAuth>} />
            <Route path="/custom/:slug" element={<RequireAuth><CustomPrediction /></RequireAuth>} />
            <Route path="/premium" element={<RequireAuth><Premium /></RequireAuth>} />
            <Route path="/premium-select" element={<RequireAuth><PremiumSelect /></RequireAuth>} />
            <Route path="/gen-store" element={<RequireAuth><GenStore /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/analyse/:game" element={<RequireAuth><AnalyseRound /></RequireAuth>} />
            <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />


            <Route path="*" element={<NotFound />} />
          </Routes>
          </NotificationsProvider>
          </CallProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
