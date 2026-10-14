/* =====================================================================
   src-tools.js - small helpers used by presentation.html
   They read the project's REAL source text (script.js, index.html,
   style.css) and:
     - find a function and return its exact code,
     - remove comments for a cleaner slide snippet,
     - colour the code for the source viewer.
   Nothing here changes the analyzer itself.
   ===================================================================== */
(function (root) {

  /** Make text safe to put inside HTML. */
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /**
   * Finds "function name(...) { ... }" in the source text.
   * Includes the /** doc comment ... *\/ right above it when there is one.
   * Returns { text, line } (line = 1-based line number where it starts)
   * or null when the function is not found.
   */
  function findFunction(src, name) {
    const m = new RegExp("^function\\s+" + name + "\\s*\\(", "m").exec(src);
    if (!m) return null;

    // Find the "{" that opens the body, then match braces to its end.
    const open = src.indexOf("{", src.indexOf(")", m.index));
    let depth = 0, end = -1;
    for (let i = open; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end < 0) return null;

    // Pull in the doc comment directly above the function.
    let start = m.index;
    const before = src.slice(0, start).replace(/\s+$/, "");
    if (before.endsWith("*/")) start = before.lastIndexOf("/*");

    return {
      text: src.slice(start, end),
      line: src.slice(0, start).split("\n").length
    };
  }

  /** Removes /* block *\/ comments and // comments (for short slide snippets). */
  function stripComments(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "")
      .replace(/[ \t]+\/\/.*$/gm, "")
      .replace(/^[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /**
   * Very small JavaScript colouring. Works line by line and remembers
   * whether a /* block comment *\/ is still open from the previous line.
   * Returns an array of HTML strings, one per line.
   */
  function highlightJs(text) {
    const TOKEN = /\/\*|\/\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|of|new|true|false|null|typeof|async|await|try|catch|throw)\b|\b\d+(?:\.\d+)?\b/;
    const span = (cls, s) => '<span class="' + cls + '">' + escapeHtml(s) + "</span>";
    let inBlock = false;

    return text.split("\n").map(line => {
      let out = "", rest = line;
      while (rest.length) {
        if (inBlock) {
          const i = rest.indexOf("*/");
          if (i < 0) { out += span("tk-c", rest); rest = ""; }
          else { out += span("tk-c", rest.slice(0, i + 2)); rest = rest.slice(i + 2); inBlock = false; }
          continue;
        }
        const m = TOKEN.exec(rest);
        if (!m) { out += escapeHtml(rest); break; }
        out += escapeHtml(rest.slice(0, m.index));
        const tok = m[0];
        rest = rest.slice(m.index + tok.length);
        if (tok === "/*") { out += span("tk-c", tok); inBlock = true; }
        else if (tok === "//") { out += span("tk-c", tok + rest); rest = ""; }
        else if (/^["'`]/.test(tok)) out += span("tk-s", tok);
        else if (/^\d/.test(tok)) out += span("tk-n", tok);
        else out += span("tk-k", tok);
      }
      return out;
    });
  }

  /** Reads "const NAME = [ ... ];" from the source and returns the array. */
  function readConstArray(src, name) {
    const m = new RegExp("const\\s+" + name + "\\s*=\\s*(\\[[\\s\\S]*?\\n\\]);").exec(src);
    if (!m) return null;
    try { return new Function("return " + stripComments(m[1]))(); } catch (e) { return null; }
  }

  const api = { escapeHtml, findFunction, stripComments, highlightJs, readConstArray };
  root.SrcTools = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
