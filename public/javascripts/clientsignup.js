async function submitHandler() {
    const rez = await sha256(document.getElementById('password').value);
    document.getElementById('password').value = rez;
    document.getElementById('signup-form').submit();
}

async function sha256(message) {
    const encodedData = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}