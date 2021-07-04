if (window.addEventListener) // W3C standard
{
  window.addEventListener('load', main, false); // NB **not** 'onload'
} 
else if (window.attachEvent) // Microsoft
{
  window.attachEvent('onload', main);
}

function main() {
    const inputField = document.getElementById('displayName-input');
    const displayNameText = document.getElementById('displayName-text');
    inputField.addEventListener('keyup', displayNameFormInputHandler);
    displayNameText.onclick=function() {
        displayNameText.classList.add('hidden');
        document.getElementById('displayName-input').placeholder = user.displayName;
        document.getElementById('displayName-form').classList.remove('hidden');
    }
}

function displayNameFormInputHandler(e) {
    const formField = document.getElementById('displayName-form');
    if (e.key === 'Enter') {
        formField.classList.add('hidden');
        formField.submit();
    }
};