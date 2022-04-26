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
            const text = context.getSourceCode().getText(node);
            //get the text of the grandparent
            const grandparentText = context
              .getSourceCode()
              .getText(node.parent.parent);

            const endingTextNode = grandparentText.replaceAll(text, "").trim();

            //keywords are '.to(' or '.from(' or '.fromTo(' or '.timeline('
            let keywords = [".to(", ".from(", ".fromTo(", ".timeline("];

            //check if the text contains any of the keywords are on the first line
            if (
              keywords.some((keyword) =>
                text.substring(0, text.indexOf("\n")).includes(keyword)
              )
            ) {
              //this must be a gsap function, lets get each chained call
              //split the text by '.to(' or '.from(' or '.fromTo(' or '.timeline('
              const splitText = text.split(
                /\.to\(|\.from\(|\.fromTo\(|\.timeline\(/g
              );

              let reported = false;

              //check if the afterText starts with any of the keywords
              if (
                !keywords.some((keyword) => endingTextNode.startsWith(keyword))
              )
                splitText.forEach((textBit) => {
                  //here we have each call in textBit
                  //get any text before the first { and after the last }
                  const beginningText = textBit.substring(
                    0,
                    textBit.indexOf(" {")
                  ); //we need a space to avoid matching with template literals
                  const endingText = textBit.substring(
                    textBit.lastIndexOf("}") + 1
                  );
                  const combinedText = beginningText + endingText;

                  //check if the combined text contains any new lines
                  if (
                    //does it have more than one new line
                    combinedText.split("\n").length > 2
                  ) {
                    //report the error
                    if (!reported) {
                      reported = true;
                      context.report({
                        node,
                        message: "GSAP functions should be compact",
                        fix: function (fixer) {
                          //get all the text before the first non-whitespace character
                          const tabs = splitText[1].substring(
                            0,
                            splitText[1].search(/\S/)
                          );

                          let fixedText = text;

                          splitText.forEach((textBit) => {
                            if (!textBit.includes(" {")) return;
                            if (!textBit.includes("}")) return;

                            //get any text before the first { and after the last }
                            const beginningText = textBit.substring(
                              0,
                              textBit.indexOf(" {")
                            );

                            const beginningTextFixed = beginningText.replaceAll(
                              /\s+/g,
                              ""
                            );

                            //replace the text with the fixed text
                            fixedText = fixedText.replaceAll(
                              beginningText,
                              beginningTextFixed
                            );

                            const endingText = textBit.substring(
                              textBit.lastIndexOf("}") + 1
                            );

                            //and endingText
                            const endingTextFixed = endingText.replaceAll(
                              /\s+/g,
                              ""
                            );
                            fixedText = fixedText.replaceAll(
                              endingText,
                              endingTextFixed
                            );
                          });

                          //replace any keywords with a space
                          keywords.forEach((keyword) => {
                            fixedText = fixedText.replaceAll(
                              ")" + keyword,
                              ")" + tabs + keyword
                            );
                          });

                          fixedText = fixedText.replaceAll(/\n {2}/g, "\n");

                          //add spaces after any commas that don't have a space after them
                          fixedText = fixedText.replaceAll(/,([^\s])/g, ", $1");

                          return fixer.replaceText(node, fixedText);
                        },
                      });
                    }
                  }
                });
            }
          },
        };
      },
    },
  },
};
