import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";

export default defineMcp({
  name: "predictor-games-mcp",
  title: "Predictor Games MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Predictor Games app (Aviator, JetX, CosmoX, Virtuel, Penalty). Use `echo` to verify connectivity.",
  tools: [echoTool],
});