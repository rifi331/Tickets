// Single source of truth for the application version.
// Mirrors package.json "version" and the GHCR image tag in the deploy workflow.
// Bumped per the spec:
//   - patch fix  -> 0.1.1
//   - new feature-> 0.2.0
export const APP_VERSION = "v0.1.1";
