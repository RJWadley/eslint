/**
 * @fileoverview better gsap formatting
 * @author RJWadley
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

//String.replaceAll polyfill
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (
      Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
    ) {
      return this.replace(str, newStr);
    }

    // If a string
    return this.replace(new RegExp(str, "g"), newStr);
  };
}

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// import all rules in lib/rules
/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  rules: {
    "compact-functions": {
      meta: {
        type: "layout",

        docs: {
          description: "make gsap functions more compact",
          category: "Layout & Formatting",
          recommended: false,
        },
        fixable: "code",
        schema: [], // no options
      },
      create: function (context) {
        return {
          CallExpression: function (node) {
            //get the text of the node
            const callExpression = context.getSourceCode().getText(node);
            //get the text of the grandparent
            const callee = context.getSourceCode().getText(node.callee);
            const text = callExpression.replace(callee, "");

            const startRange = node.callee.range[1] + 1;

            //keywords are '.to(' or '.from(' or '.fromTo(' or '.timeline('
            let keywords = [".to", ".from", ".fromTo", ".timeline"];
            let exclude = ["Array.from"];

            //get the loc of callee
            const startLocation = node.callee.loc.end;
            const endLocation = node.loc.end;

            // context.report({
            //   node,
            //   message:
            //     "Compact gsap functions: " + JSON.stringify(startLocation),
            // });

            //check if the calle ends with a keyword
            if (
              keywords.some((keyword) => callee.endsWith(keyword)) &&
              !exclude.some((excludeKeyword) => callee.endsWith(excludeKeyword))
            ) {
              const before = text.split("{")[0];
              if (text.split("{").length > 1) {
                const indexOfFirstBrace = text.indexOf("{");
                const rangeOfText = [
                  startRange,
                  indexOfFirstBrace + startRange,
                ];
                const sectionText = text.substring(1, indexOfFirstBrace + 1);
                let newText = sectionText.replaceAll("\n", "");
                newText = newText.replace(/^\s+/g, "");
                newText = newText.replace(/\s+/g, " ");

                if (before.includes("\n")) {
                  context.report({
                    loc: {
                      start: {
                        line: startLocation.line,
                        column: 0,
                      },
                      end: {
                        line: startLocation.line + 1,
                        column: -1,
                      },
                    },
                    message: "Compact gsap functions:" + sectionText,
                    fix: function (fixer) {
                      return fixer.replaceTextRange(rangeOfText, newText);
                    },
                  });
                }
              }

              const after = text.split("}").at(-1);
              if (text.split("}").length > 1) {
                const indexOfLastBrace = text.lastIndexOf("}");
                const rangeOfText = [
                  startRange + indexOfLastBrace,
                  startRange + text.length - 2,
                ];
                const sectionText = text.substring(
                  indexOfLastBrace + 1,
                  text.length - 2
                );
                let newText = sectionText.replaceAll("\n", "");
                newText = newText.replace(/\s+$/g, "");
                newText = newText.replace(/\s+/g, " ");

                if (after.includes("\n")) {
                  context.report({
                    loc: {
                      start: {
                        line: endLocation.line - 1,
                        column: 0,
                      },
                      end: {
                        line: endLocation.line,
                        column: 0,
                      },
                    },
                    message: "GSAP functions should be compact",
                    fix: function (fixer) {
                      return fixer.replaceTextRange(rangeOfText, newText);
                    },
                  });
                }
              }
            }
          },
        };
      },
    },
  },
};
