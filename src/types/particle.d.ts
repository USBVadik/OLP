// Workaround for @particle-network/universal-account-sdk@2.0.0-beta.3.
//
// The package ships real types at dist/index.d.ts, but its package.json "exports"
// map doesn't expose them under the import condition, so TypeScript can't resolve
// them (TS7016) under this project's moduleResolution. Every use of the SDK in this
// app is a dynamic `await import("@particle-network/universal-account-sdk")` assigned
// to an any-typed value, so a bare ambient module declaration is sufficient to compile.
//
// Remove this file once the SDK fixes its "exports"/"types" packaging, to pick up the
// real v2 typings.
declare module "@particle-network/universal-account-sdk";
