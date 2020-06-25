# FormSaver
##### A [GUN](https://gun.eco)-based library to enable backups of your users' unsubmitted forms.

FormSaver will enable your users to restore their current progress on any device by sharing a code (or a link).

## Usage
Create a form, naming it and its inputs, in your HTML:
```html
<form action="/" method="post" name="myForm">
        <label for="name">Type your name</label><br>
        <input type="text" name="name" id="name"><br>
        <label for="feeling">Are you feeling well?</label><br>
        <input type="radio" name="feeling" id="well" value="well">
        <label for="well">Yes</label><br>
        <input type="radio" name="feeling" id="not-well" value="not-well">
        <label for="not-well">No</label><br>
        <input type="submit" value="Submit">
    </form>
```
Initialize FormSaver:
```js
const fs = new FormSaver();
```
Every time the user changes input, call `<FormSaver>.setBackup()`, using the form's name or element as argument:
```js
document.myForm.querySelectorAll("input").forEach(function (elem) {
    elem.addEventListener(function (e) {
        var result = await fs.setBackup("myForm");
        // or
        var result = await fs.setBackup(document.myForm);
        const backupKey = response.backup;
    });
})
```
A backup key will be generated and can be accessed in the promise result: `result.backup`

When the user comes back later, request the backup key and submit it:
```js
await fs.submitBackup(backupKey);
```
Then you can retrieve the saved data and apply it into the form:
```js
await fs.getBackup(formElementOrName);
```
Saving data will continue to work.
When the user has finished and submitted the form, discard the saved data:
```js
fs.discardBackup();
```
Currently it works with:
- text inputs
- radio inputs
- select inputs
- checkbox inputs

If you want to use it with other input types or you want to have more control, you can save and get raw data, then apply it into the form manually:
```js
const rawData = await fs.getRawBackup();
await fs.setRawBackup(objectToSave);
```