export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function page(title, content) {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><title>${escapeHtml(title)} · STW Alerts</title>
<link rel="stylesheet" href="/mcp/auth/assets/auth.css"><script src="/mcp/auth/assets/auth.js" defer></script></head>
<body><main><a class="brand" href="/mcp/auth/sign-in" aria-label="STW Alerts access">STW<span>ALERTS</span></a>
<section class="card">${content}</section><footer>Private access · STW Alerts</footer></main></body></html>`;
}

export function signInPage(query = '') {
    return page('Sign in', `<p class="eyebrow">OWNER ACCESS</p><h1>Connect your alerts.</h1>
<p class="description">Sign in to authorize access to your STW Alerts tools.</p>
<form data-action="sign-in"><input type="hidden" name="oauth_query" value="${escapeHtml(query)}">
<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" required autofocus>
<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" minlength="16" maxlength="128" required>
<p class="error" role="alert" hidden></p><button type="submit">Sign in</button></form>
<p class="note">Access is limited to the owner account.</p>`);
}

const permissionLabels = {
    'alerts:read': 'Read latest missions, search mission history and view reward totals.',
    offline_access: 'Keep the connection active by renewing access when you are away.',
};

export function consentPage({ query, clientName, scopes, email }) {
    return page('Authorize access', `<p class="eyebrow">CONNECT AN APPLICATION</p><h1>Allow access?</h1>
<p class="description"><strong>${escapeHtml(clientName)}</strong> wants to connect to STW Alerts.</p>
<ul class="permissions">${scopes.map((scope) => `<li>${escapeHtml(permissionLabels[scope] ?? scope)}</li>`).join('')}</ul>
<div class="identity"><span>Signed in as</span><strong>${escapeHtml(email)}</strong></div>
<form data-action="consent"><input type="hidden" name="oauth_query" value="${escapeHtml(query)}">
<p class="error" role="alert" hidden></p><div class="actions"><button type="submit" name="decision" value="deny" class="secondary">Deny</button>
<button type="submit" name="decision" value="allow">Allow access</button></div></form>
<p class="note">These tools can only read alerts. They cannot change or delete them.</p>`);
}

export function connectedPage(email) {
    return page('Account', `<p class="eyebrow">OWNER ACCOUNT</p><h1>You are signed in.</h1>
<p class="description">Return to ChatGPT to finish connecting your alerts.</p>
<div class="identity"><span>Signed in as</span><strong>${escapeHtml(email)}</strong></div>
<form data-action="sign-out"><p class="error" role="alert" hidden></p><button type="submit" class="secondary">Sign out</button></form>`);
}

export function errorPage(message) {
    return page('Unable to continue', `<p class="eyebrow">CONNECTION ERROR</p><h1>Unable to continue.</h1>
<p class="description">${escapeHtml(message)}</p><p class="note">Start the connection again from ChatGPT.</p>`);
}
