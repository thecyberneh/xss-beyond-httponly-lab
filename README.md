# The Illusion of Safety: Exploiting XSS Beyond "HttpOnly" Cookies

---

## Start Here: Read the Full Write-up First!

Hey Hackers! Before you dive into the code and demo, **please read my detailed blog post** explaining the full attack chain, theory, and impact behind this lab:

👉 [https://thecyberneh.github.io/posts/Exploiting+XSS+Beyond+HttpOnly+Cookies/](https://thecyberneh.github.io/posts/Exploiting+XSS+Beyond+HttpOnly+Cookies/)

This write-up covers:
- What `HttpOnly` cookies really protect
- Why many XSS bugs with HttpOnly cookies get underrated
- How storing CSRF tokens in localStorage can be abused via XSS
- The magic of chaining Stored XSS + CSRF for privilege escalation

---

## What Is This Repo?

This repository contains the **demo lab** I built to accompany the blog post above.

It is a **simplified web app** simulating the vulnerability and attack flow:

- Normal users upload SVG profile pictures (vulnerable to stored XSS)
- Admin views these pictures and can promote users to admin
- CSRF tokens protect sensitive actions — but the token is stored in localStorage, accessible via injected JavaScript
- The demo shows how an attacker can exploit this chain to **escalate from normal user to admin**

---

## Why This Matters

Many pentesters dismiss XSS with `HttpOnly` cookies as low impact because cookies can’t be stolen. But this demo proves that:

- Attackers can **bypass HttpOnly protections by abusing localStorage-stored CSRF tokens**
- XSS combined with CSRF can be a potent attack chain leading to full privilege escalation
- Always scrutinize where sensitive tokens are stored and how your app protects critical actions

---

## How to Run This Lab Locally

```bash
git clone https://github.com/yourusername/xss-beyond-httponly-lab.git
cd xss-beyond-httponly-lab
npm install
```

### Launch the App

```bash
node app.js
```

Open your browser at [http://localhost:3000](http://localhost:3000)

**Note:** On the first run, the admin password is randomly generated and shown in your console.

---

## What You Can Do in This Lab

- Log in as a normal user and upload an SVG with a malicious XSS payload
- Log in as admin and view user profile images to trigger the XSS
- Observe how the injected JavaScript steals the CSRF token from localStorage and performs a privileged `promote-user` request
- Understand how the chained attack bypasses HttpOnly cookie protections and CSRF defenses

---

## Important Notes

- This is a **demo app for educational purposes only**.
- Do **NOT** use this code or techniques against any real-world systems without explicit permission.
- Feel free to reach out on Twitter if you want the source code or have questions: [@thecyberneh](https://twitter.com/thecyberneh)

---

## Connect with Me

If you found this useful, follow me for more writeups and security insights:

- Twitter: [@thecyberneh](https://twitter.com/thecyberneh)
- LinkedIn: [thecyberneh](https://www.linkedin.com/in/thecyberneh)
- Instagram: [thecyberneh](https://www.instagram.com/thecyberneh/)

---

Thanks for reading and happy hacking! 🚀
