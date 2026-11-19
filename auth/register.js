const registerSection = document.querySelector(".register-section");
const verifySection = document.querySelector(".verify-section");
const successSection = document.querySelector(".success-section");
const registerForm = document.querySelector(".register-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const verifyMessage = document.querySelector(".verify-email-message");
const verifyStatus = document.querySelector(".verify-email-status");
const resendBtn = document.querySelector(".verify-email-resend");
const submitBtn = registerForm?.querySelector('button[type="submit"]');

const requiredElements = [
    registerSection,
    verifySection,
    successSection,
    registerForm,
    nameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    verifyMessage,
    verifyStatus,
    resendBtn,
    submitBtn
];

if (requiredElements.some((element) => !element)) {
    throw new Error("The registration page is missing required form elements.");
}

const authState = {
    status: "register",
    loading: false,
    email: ""
};

const apiBaseUrl = "http://localhost:5000/api/auth";
const submitLabel = submitBtn.textContent.trim();
const resendLabel = resendBtn.textContent.trim();

function renderUI() {
    registerSection.hidden = authState.status !== "register";
    verifySection.hidden = authState.status !== "verify-email";
    successSection.hidden = authState.status !== "success";

    if (authState.status === "verify-email") {
        verifyMessage.textContent = `We sent a verification link to ${authState.email}.`;
    }
}

function setPasswordsValidity() {
    const passwordsMatch = passwordInput.value === confirmPasswordInput.value;
    confirmPasswordInput.setCustomValidity(
        passwordsMatch ? "" : "Passwords do not match."
    );
}

async function ensureSuccessfulResponse(response, fallbackMessage) {
    const responseText = await response.text();
    let data = null;

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            if (!response.ok) {
                throw new Error(fallbackMessage);
            }
        }
    }

    if (!response.ok) {
        const message = data && typeof data.message === "string"
            ? data.message
            : fallbackMessage;
        throw new Error(message);
    }

    return data;
}

function showError(error, fallbackMessage) {
    const message = error instanceof Error && error.message
        ? error.message
        : fallbackMessage;
    window.alert(message);
}

passwordInput.addEventListener("input", setPasswordsValidity);
confirmPasswordInput.addEventListener("input", setPasswordsValidity);
nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (authState.loading) {
        return;
    }

    const fullName = nameInput.value.trim();
    if (!fullName) {
        nameInput.setCustomValidity("Enter your full name.");
        nameInput.reportValidity();
        return;
    }
    nameInput.setCustomValidity("");

    setPasswordsValidity();
    if (!registerForm.reportValidity()) {
        return;
    }

    const [firstName, ...surnameParts] = fullName.split(/\s+/);
    const surname = surnameParts.join(" ");

    authState.loading = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    try {
        const response = await fetch(`${apiBaseUrl}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                firstName,
                surname,
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });

        await ensureSuccessfulResponse(response, "Registration failed.");
        authState.email = emailInput.value.trim();
        authState.status = "verify-email";
        renderUI();
    } catch (error) {
        showError(error, "Registration failed.");
    } finally {
        authState.loading = false;
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
    }
});

async function verifyEmail(token) {
    authState.loading = true;
    authState.status = "verifying";
    renderUI();

    try {
        const response = await fetch(
            `${apiBaseUrl}/verify-email?token=${encodeURIComponent(token)}`
        );
        await ensureSuccessfulResponse(response, "Email verification failed.");

        authState.status = "success";

        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState(
            {},
            document.title,
            `${url.pathname}${url.search}${url.hash}`
        );

        renderUI();
    } catch (error) {
        authState.status = "register";
        renderUI();
        showError(error, "Email verification failed.");
    } finally {
        authState.loading = false;
    }
}

resendBtn.addEventListener("click", async () => {
    if (authState.loading || !authState.email) {
        return;
    }

    authState.loading = true;
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending...";

    try {
        const response = await fetch(`${apiBaseUrl}/resend-verification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: authState.email
            })
        });

        await ensureSuccessfulResponse(
            response,
            "Could not resend verification email."
        );
        verifyStatus.textContent = "Email sent again.";
    } catch (error) {
        showError(error, "Could not resend verification email.");
    } finally {
        authState.loading = false;
        resendBtn.disabled = false;
        resendBtn.textContent = resendLabel;
    }
});

const verificationToken = new URLSearchParams(window.location.search).get("token");
if (verificationToken) {
    verifyEmail(verificationToken);
} else {
    renderUI();
}
