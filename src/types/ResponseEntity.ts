// export interface ResponseEntity {
//     status: number,
//     data?: any,
//     errorMessage?: string
// }

export class ResponseEntity {

    status: number;
    data?: any;
    errorMessage?: string;

   constructor(status: number, data: any, errorMessage?: string) {
        this.status = status;
        this.data = data;
        this.errorMessage = errorMessage;
   }

}