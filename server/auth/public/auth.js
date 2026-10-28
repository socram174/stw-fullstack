const form = document.querySelector('form[data-action]');

form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const action = form.dataset.action;
    const data = new FormData(form);
    const error = form.querySelector('[role="alert"]');
    const buttons = [...form.querySelectorAll('button')];
    const decision = event.submitter?.value;
    error.hidden = true;
    buttons.forEach((button) => { button.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    const oauthQuery = data.get('oauth_query');
    const body = action === 'sign-in'
        ? { email: data.get('email'), password: data.get('password'), callbackURL: '/mcp/auth/connected', ...(oauthQuery ? { oauth_query: oauthQuery } : {}) }
        : action === 'consent' ? { accept: decision === 'allow', oauth_query: oauthQuery } : {};
    const endpoint = { 'sign-in': '/sign-in/email', consent: '/oauth2/consent', 'sign-out': '/sign-out' }[action];
    try {
        const response = await fetch(`/api/auth${endpoint}`, {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(body),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(response.status === 429
            ? 'Too many attempts. Please wait a minute and try again.'
            : action === 'sign-in' ? 'Unable to sign in. Check your credentials and try again.'
                : 'Unable to continue. Please restart the connection from ChatGPT.');
        const target = new URL(result.url || (action === 'sign-out' ? '/mcp/auth/sign-in' : '/mcp/auth/connected'), window.location.origin);
        if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Invalid authorization redirect.');
        window.location.assign(target.href);
    } catch (cause) {
        error.textContent = cause instanceof TypeError ? 'Unable to connect. Please try again.' : cause.message;
        error.hidden = false;
        buttons.forEach((button) => { button.disabled = false; });
        form.removeAttribute('aria-busy');
    }
});
