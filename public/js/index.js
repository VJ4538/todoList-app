
$(document).ready(function(){
    let checkbox=$(".checkboxes");
    checkbox.click(function(){
        $(this).parent().find($("span")).toggleClass("crossout");
        
        if(checkbox.checked){
            $(".checkedHidden").disabled=true;
        }
    })


})

