const babel = require("@babel/core");
const fs = require("fs");
const files = [
  "components/Travel-Componets/PostCard.tsx",
  "components/Travel-Componets/componentStyle.js",
  "components/Travel-Componets/vote.tsx",
  "components/Travel-Componets/payments.js",
  "components/Travel-Componets/ImagesComponent.js",
  "components/Travel-Componets/ToDo.tsx",
];
for (const f of files) {
  try {
    babel.transformFileSync(f, { presets: ["module:metro-react-native-babel-preset"] });
    console.log("OK", f);
  } catch (e) {
    console.log("FAIL", f, e.message);
  }
}
