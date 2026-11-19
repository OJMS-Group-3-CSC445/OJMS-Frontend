const passwordInput = document.getElementById("password");
    const passwordToggle = document.querySelector(".password-toggle");

    passwordToggle.addEventListener("click", () => {
      const isVisible = passwordInput.type === "text";
      passwordInput.type = isVisible ? "password" : "text";
      passwordToggle.textContent = isVisible ? "Show" : "Hide";
      passwordToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      passwordToggle.setAttribute("aria-pressed", String(!isVisible));
    });

    document.querySelector(".login-form").addEventListener("submit", (event) => {
      event.preventDefault();
    });