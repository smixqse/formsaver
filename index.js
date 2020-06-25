import Gun from "gun/gun";
import SEA from "gun/sea"
import 'gun/lib/promise.js';

/**
 * Main FormSaver class
*/
class FormSaver {
    _gun;
    _keys;
    _user;
    _isUserAvailable = false;

    constructor (peers = ["https://gun-eu.herokuapp.com/gun"], gun = Gun(peers)) {
        this._gun = gun;
    };

    /**
     * Submit an existing backup key
     * @param {string} backup - Encoded backup key
     * @returns {Promise<string>} Confirmation of submission
     */
    submitBackup(backup) {
        return new Promise (async (resolve, reject) => {
            this._keys = JSON.parse(atob(backup));
            this._user = this._gun.user();
            this._user.auth(this._keys);
            this._user.pair = this._keys;
            this._isUserAvailable = true;
            setTimeout(() => {resolve("Submitted");}, 500);
        });
    };

    async _createUser() {
        const pair = await SEA.pair();
        this._keys = pair;
        this._user = this._gun.user();
        this._user.auth(pair);
        this._user.pair = pair;
        this._isUserAvailable = true;
    };

    /**
     * Get raw backup data
     * @returns {object} - Raw backup data
     */
    getRawBackup() {
        return new Promise (async (resolve, reject) => {
            if (!this._isUserAvailable) {reject("No user available"); return};
            const data = await SEA.decrypt((await this._user.get("formOptions").promOnce()).data, this._keys);
            if (data === null || data === undefined) {reject("Data is null");} else {resolve(data);};
        });

    };

    /**
     * @typedef BackupSetResult
     * @property {string} status Always is "saved"
     * @property {string} backup Your backup key
     */

    /**
     * Set raw backup data
     * @param {object} data - Raw data object to save
     * @returns {Promise<BackupSetResult>} Save confirmation and backup key
     */
    setRawBackup(data) {
        return new Promise (async (resolve, reject) => {
            if (!this._isUserAvailable) this._createUser();
            setTimeout(async () => {
                const sent = await this._user.get("formOptions").promPut(await SEA.encrypt(data, this._keys));
                resolve({status: "saved", "backup": btoa(JSON.stringify(this._keys))});
            }, 500)
        });
    };

    /**
     * Fetches your backup data and displays them on the form
     * @param {string | HTMLFormElement} form - Form name or form element
     * @returns {Promise<object>} Fetched raw backup data
     */
    getBackup(form) {
        return new Promise((resolve, reject) => {
            if (!this._isUserAvailable) {reject("No user available"); return};
            setTimeout(async () => {
                var data = await SEA.decrypt((await this._user.get("formOptions").promOnce()).data, this._user.pair);
                var elem = {};
                if (typeof form === "string") {
                    elem = document.querySelector(`form[name=${form}]`) || {}
                } else {
                    element = form || {}
                };
                if (elem === {}) {
                    reject("Form element not found");
                    return
                };
                if (typeof data !== "object") {
                    reject("Fetched data isn't an object");
                    return
                };
                elem.querySelectorAll("input, select").forEach(function (element) {
                    if (Object.keys(data).includes(element.name)) {
                        if (data[element.name].type === "text") { 
                            element.value = data[element.name].val;
                        } else if (data[element.name].type === "radio" && data[element.name].val === element.value) {
                            element.checked = true;
                        } else if (data[element.name].type === "select") {
                            element.value = data[element.name].val;
                        } else if (data[element.name].type === "check") {
                            element.checked = data[element.name].val;
                        };
                    };
                });
                resolve(data);
            }, 500);
        });
    };
    /**
     * Fetches your current form data and saves it to the backup
     * @param {string | HTMLFormElement} form - Form name or form element
     * @returns {Promise<BackupSetResult>} Save confirmation and backup key
     */
    setBackup(form) {
        return new Promise (async (resolve, reject) => {
            if (!this._isUserAvailable) this._createUser();
            var elem = {};
            if (typeof form === "string") {elem = document.querySelector(`form[name=${form}]`) || {}} else {element = form || {}};
            if (elem === {}) {reject("Form element not found"); return};
            var formToSend = {};
            elem.querySelectorAll("input, select").forEach(function (element) {
                if (element.type === "text") {
                    formToSend[element.name] = {
                        type: "text",
                        val: element.value
                    };
                } else if (element.type === "radio") {
                    if (element.checked) {
                        formToSend[element.name] = {
                            type: "radio",
                            val: element.value
                        };
                    } else {
                        if (!formToSend[element.name]) {
                            formToSend[element.name] = {
                                type: "radio",
                                val: ""
                            };
                        };
                    };
                } else if (element.tagName.toLowerCase() === "select") {
                    if (element.value.length > 0) {
                        formToSend[element.name] = {
                            type: "select",
                            val: element.value
                        };
                    } else {
                        if (!formToSend[element.name]) {
                            formToSend[element.name] = {
                                type: "select",
                                val: ""
                            };
                        };
                    };
                } else if (element.type === "checkbox") {
                    if (element.checked) {
                        formToSend[element.name] = {
                            type: "check",
                            val: true
                        };
                    } else {
                        if (!formToSend[element.name]) {
                            formToSend[element.name] = {
                                type: "check",
                                val: false
                            };
                        };
                    };
                };
            });
            setTimeout(async () => {
                const sent = await this._user.get("formOptions").promPut(await SEA.encrypt(formToSend, this._keys));
                resolve({status: "saved", "backup": btoa(JSON.stringify(this._keys))});
            }, 500);
        })
    };

    /**
     * Discards saved data to clean up memory
     */
    async discardBackup () {
        if (!this._isUserAvailable) return;
        await this._user.get("formOptions").promPut(null);
        this._user.delete();
        this._user = this._gun.user();
        this._isUserAvailable = false;
        this._keys = {};
        localStorage["gun/"] = {};
        localStorage["gap/gun/"] = {};
    };
};

if (window && !window.FormSaver) window.FormSaver = FormSaver;

export default FormSaver;