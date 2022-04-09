/* global firebase, firebaseui, Stripe */

/**
 * Replace with your publishable key from the Stripe Dashboard
 * https://dashboard.stripe.com/apikeys
 */
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51KmUVlGOLvbx60katk6AJFOpqppd5A8EsjR9jJqoI1KmYRwcfxgUxMlspvk1ZXE5LPbUdaQFxVnNyUA79FZtuByi00YsiPFBBK";

/**
 * Your Firebase config from the Firebase console
 * https://firebase.google.com/docs/web/setup#config-object
 */
const firebaseConfig = {
  apiKey: "AIzaSyCSf1-WAC7IGuSonEZ9W4BJjDjVPF_qzBI",
  authDomain: "stripesubscription-45d0c.firebaseapp.com",
  projectId: "stripesubscription-45d0c",
  storageBucket: "stripesubscription-45d0c.appspot.com",
  messagingSenderId: "495990845079",
  appId: "1:495990845079:web:56570694ff3a61487743d2",
};

/**
 * Initialize Firebase
 */
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
let currentUser;

/**
 * Firebase Authentication configuration
 */
const firebaseUI = new firebaseui.auth.AuthUI(firebase.auth());
const firebaseUiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return true;
    },
    uiShown: () => {
      document.querySelector("#loader").style.display = "none";
    },
  },
  signInFlow: "popup",
  signInSuccessUrl: "/",
  signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID],
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  // Your terms of service url.
  tosUrl: "https://example.com/terms",
  // Your privacy policy url.
  privacyPolicyUrl: "https://example.com/privacy",
};
firebase.auth().onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    currentUser = firebaseUser.uid;
    startDataListeners();
  } else {
    window.location.href = "/account.html";
  }
});

/**
 * Data listeners
 */
function startDataListeners() {
  // Get all our products and render them to the page
  const todos = document.querySelector(".todos");
  const template = document.querySelector("#todo");

  // Listen for new todo events.
  const form = document.querySelector("#todo-form");
  form.addEventListener("submit", create);

  // Render all todos for a customer.
  db.collection("customers")
    .doc(currentUser)
    .collection("todos")
    .orderBy("created")
    .onSnapshot(async (snapshot) => {
      todos.textContent = "";
      snapshot.docs.forEach((todo) => {
        const text = todo.data().text;
        const container = template.content.cloneNode(true);
        const textElement = container.querySelector(".todo-text");
        textElement.innerText = text;
        const checkbox = container.querySelector("input");
        checkbox.setAttribute("data-todo-id", todo.id);
        checkbox.addEventListener("click", toggleTodo);
        if (todo.data().complete || false) {
          checkbox.setAttribute("checked", "checked");
          textElement.classList.add("complete");
        }
        const deleteButton = container.querySelector(".delete-button");
        deleteButton.setAttribute("data-todo-id", todo.id);
        deleteButton.addEventListener("click", deleteTodo);
        todos.appendChild(container);
      });

      // Show the UI.
      document.querySelector("#loader").style.display = "none";
      document.querySelector("main").style.display = "block";
    });
}
/**
 * Event listeners
 */
// Todo creation handler
async function create(event) {
  event.preventDefault();
  document.querySelector(".add-button").disabled = true;
  const formData = new FormData(event.target);
  document.querySelector("#text").value = "";

  await db
    .collection("customers")
    .doc(currentUser)
    .collection("todos")
    .add({
      text: formData.get("text"),
      created: new Date(),
      complete: false,
    });
  document.querySelector(".add-button").disabled = false;
}

// Todo deletion handler
async function deleteTodo(event) {
  event.preventDefault();
  const todoId = event.target.getAttribute("data-todo-id");
  await db
    .collection("customers")
    .doc(currentUser)
    .collection("todos")
    .doc(todoId)
    .delete();
}

// Todo completion/uncompletion handler
async function toggleTodo(event) {
  event.preventDefault();
  const todoId = event.target.getAttribute("data-todo-id");
  const checked = event.target.getAttribute("checked") === "checked";
  await db
    .collection("customers")
    .doc(currentUser)
    .collection("todos")
    .doc(todoId)
    .update({ complete: !checked });
}
