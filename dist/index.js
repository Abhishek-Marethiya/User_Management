"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const baseUrl = "http://localhost:3000/users";
const output = document.getElementById("output");
const form = document.getElementById("userForm");
const getuserbtn = document.getElementById("getuserbtn");
const deleteUserbtn = document.getElementById("deleteUserbtn");
const getAllUserbtn = document.getElementById("getAllUserbtn");
getuserbtn.addEventListener('click', () => getUserById());
getAllUserbtn.addEventListener('click', () => fetchAllUsers());
deleteUserbtn.addEventListener('click', () => deleteUserById());
form.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
    e.preventDefault();
    const user = {
        id: +document.getElementById("id").value,
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        age: +document.getElementById("age").value,
    };
    const res = yield fetch(`${baseUrl}/${user.id}`);
    const method = res.ok ? "PATCH" : "POST";
    const url = method === "POST" ? baseUrl : `${baseUrl}/${user.id}`;
    const saveRes = yield fetch(url, {
        method,
        body: JSON.stringify(user),
    });
    if (saveRes.ok) {
        alert("User saved/updated successfully!");
        fetchAllUsers();
        form.reset();
    }
    else {
        alert("Failed to save user.");
    }
}));
function fetchAllUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(baseUrl);
        const users = yield res.json();
        output.textContent = JSON.stringify(users, null, 2);
    });
}
function getUserById() {
    return __awaiter(this, void 0, void 0, function* () {
        const id = document.getElementById("searchId").value;
        if (!id)
            return alert("Enter an ID");
        const res = yield fetch(`${baseUrl}/${id}`);
        if (!res.ok)
            return alert("User not found");
        const user = yield res.json();
        output.textContent = JSON.stringify(user);
    });
}
function deleteUserById() {
    return __awaiter(this, void 0, void 0, function* () {
        const id = document.getElementById("searchId").value;
        if (!id)
            return alert("Enter an ID");
        const res = yield fetch(`${baseUrl}/${id}`, {
            method: "DELETE",
        });
        if (res.ok) {
            alert("User deleted successfully");
            fetchAllUsers();
        }
        else {
            alert("Failed to delete user");
        }
    });
}
