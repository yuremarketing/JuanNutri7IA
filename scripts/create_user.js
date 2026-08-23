import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCRZsxp-nptfLoCW1R1781Ws4whi3KMrMs",
  authDomain: "juannutri7ia.firebaseapp.com",
  projectId: "juannutri7ia"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

createUserWithEmailAndPassword(auth, "juan@nutri7ia.com", "senha123")
  .then((userCredential) => {
    console.log("Usuário criado com sucesso:", userCredential.user.email);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro ao criar usuário:", error.code, error.message);
    process.exit(1);
  });
