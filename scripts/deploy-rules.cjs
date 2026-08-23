const admin = require("firebase-admin");
const fs = require("fs");
const serviceAccount = require("../secrets/firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function deployRules() {
  try {
    const rulesSource = fs.readFileSync("./firestore.rules", "utf8");
    const ruleset = await admin.securityRules().createRuleset({
      source: {
        files: [
          {
            name: "firestore.rules",
            content: rulesSource
          }
        ]
      }
    });
    
    await admin.securityRules().releaseFirestoreRuleset(ruleset.name);
    console.log("Regras do Firestore atualizadas com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar regras:", error);
  }
}

deployRules();
