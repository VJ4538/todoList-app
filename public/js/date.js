let date = new Date();
let year =date.getFullYear();
let month; 
if(date.getMonth()<10){
    month=`${date.getMonth()+1}`;
}else{
    month=date.getMonth()+1;
}
let day;
if(date.getDate()<10){
    day=`${date.getDate()}`;
}else{
    day=date.getDate();
}
let currentdate=`${month}-${day}-${year}`;

// console.log(currentdate);
// //exporting current day
exports.day=currentdate;
