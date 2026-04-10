import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/app.jsx"],
  bundle: false,
  outfile: "static/app.js",
  minify: true,
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  target: ["es2020"],
  charset: "utf8",
});

console.log("Build complete: static/app.js");
