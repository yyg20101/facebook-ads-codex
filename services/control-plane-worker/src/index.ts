import { handleOfflineRequest } from "./http";

export default {
  async fetch(request, env, _context): Promise<Response> {
    return handleOfflineRequest(request, env);
  }
} satisfies ExportedHandler<Env>;
