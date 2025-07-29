// type User={
//     id:number;
//     name:string;
//     email:string;
//     age:number;
// }

// type ids={
//     id:number
// }

// class DataBase<T extends ids>{
     
//     private memory:T[]=[];


//     addData(data:T):void{
//         if(this.getData(data.id)!==undefined){
//             console.log("User Already With same id....");
//             return;
//         }
//           this.memory.push(data);
//     }

//     getData(id:number):T | undefined{
//       return this.memory.find(item=> item.id===id)
//     }
//     deleteData(id:number):boolean{
//        const index=this.memory.findIndex(item =>item.id===id);

//        if(index!==-1){
//           this.memory.slice(index,1);
//           return true;
//        }
//        return false;
//     }

//     getAllData():T[]{
//         return this.memory;
//     }
//     updateData(id:number,updatedData:Partial<T>):boolean{
//          const index=this.memory.findIndex(item=>item.id==id);
//          if(index ===-1) return false;

//          this.memory[index]={...this.memory[index],...updatedData}
//          return true
//     }

// }


// const user1=new DataBase<User>();


// user1.addData({id:1,name:"Abhishek",email:"abhishek@gmail.com",age:21});

// user1.addData({id:2,name:"shek",email:"shek@gmail.com",age:21});
// user1.addData({id:8,name:"shek",email:"shek@gmail.com",age:29});

// console.log(user1.getAllData());

// console.log(user1.updateData(2,{name:"Kuldeep"}));

// console.log(user1.getAllData());


// type User = {
//   id: number;
//   name: string;
//   email: string;
//   age: number;
// };

// type ids ={
//  id: number 
// }

// class Database<T extends ids> {
//   private baseUrl: string;

//   constructor( baseUrl:string) {
//     this.baseUrl = baseUrl;
//   }

//   async addData(data: T): Promise<void> {
      
     
//     if (await this.getData(data.id)) {
//       console.log("User Already with same id");
//       return;
//     }

//     await fetch(this.baseUrl, {
//       method: "POST",
//       body: JSON.stringify(data),
//     });
//   }

//   async getData(id: number): Promise<T | undefined> {

//     const res = await fetch(`${this.baseUrl}${id}`,{
//         method:"GET"
//     });
    
//     if (!res.ok) return undefined;
 
//     return res.json();
//   }

//   async deleteData(id: number): Promise<boolean> {
//     const res = await fetch(`${this.baseUrl}/${id}`, {
//       method: "DELETE",
//     });
//     return res.ok;
//   }

//   async getAllData(): Promise<T[]> {
//     const res = await fetch(this.baseUrl);
//     console.log(res);
    
//     return res.json();
//   }

//   async updateData(id: number, updatedData: Partial<T>): Promise<boolean> {
//     const res = await fetch(`${this.baseUrl}/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(updatedData),
//     });
//     return res.ok;
//   }
// }

// const userDB = new Database<User>("http://localhost:3000/users");

// (async () => {
//   await userDB.addData({ id: 7, name: "Abhishek", email: "abhi@gmail.com", age: 24 });
//    console.log(await userDB.getData(2));
   
 
//   console.log(await userDB.getAllData());

//   await userDB.updateData(2, { name: "Kuldeep" });



//   console.log(await userDB.getAllData());

//   await userDB.deleteData(1);


//   console.log(await userDB.getAllData());
// })();




 type User = {
        id: number;
        name: string;
        email: string;
        age: number;
      };

      const baseUrl = "http://localhost:3000/users";

      const output = document.getElementById("output")!;
      const form = document.getElementById("userForm") as HTMLFormElement;
    const  getuserbtn=document.getElementById("getuserbtn") as HTMLButtonElement;
    const deleteUserbtn=document.getElementById("deleteUserbtn") as HTMLButtonElement;
    const getAllUserbtn=document.getElementById("getAllUserbtn") as HTMLButtonElement;
    
    
      getuserbtn.addEventListener('click',()=> getUserById())
      getAllUserbtn.addEventListener('click',()=>fetchAllUsers())
      deleteUserbtn.addEventListener('click',()=>deleteUserById())



      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user: User = {
          id: +(<HTMLInputElement>document.getElementById("id")).value,
          name: (<HTMLInputElement>document.getElementById("name")).value,
          email: (<HTMLInputElement>document.getElementById("email")).value,
          age: +(<HTMLInputElement>document.getElementById("age")).value,
        };

        // mtlb is id se already se data hai 
        const res = await fetch(`${baseUrl}/${user.id}`); 
        
        const method = res.ok ? "PATCH" : "POST";
        const url = method === "POST" ? baseUrl : `${baseUrl}/${user.id}`;
         

        const saveRes = await fetch(url, {
          method,
          body: JSON.stringify(user),
        });

        if (saveRes.ok) {
          alert("User saved/updated successfully!");
          fetchAllUsers();
          form.reset();
        } else {
          alert("Failed to save user.");
        }
      });



      async function fetchAllUsers() {

        const res = await fetch(baseUrl);
        const users = await res.json();
        output.textContent = JSON.stringify(users,null,2);
      }


      async function getUserById() {
        const id = (<HTMLInputElement>document.getElementById("searchId")).value;

        if (!id) return alert("Enter an ID");

        const res = await fetch(`${baseUrl}/${id}`);
        if (!res.ok) return alert("User not found");

        const user = await res.json();
        output.textContent = JSON.stringify(user);
    
      }

      async function deleteUserById() {
        const id = (<HTMLInputElement>document.getElementById("searchId")).value;
        if (!id) return alert("Enter an ID");

        const res = await fetch(`${baseUrl}/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          alert("User deleted successfully");
          fetchAllUsers();
        } else {
          alert("Failed to delete user");
        }
      }

