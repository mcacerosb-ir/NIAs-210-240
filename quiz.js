/* ========== QUIZ (compartido) — Estilo Medieval ========== */
function renderQuiz(n){
  var c=document.getElementById("quiz-"+n);
  var d=qs[n];
  var h="";
  for(var i=0;i<d.length;i++){
    h+="<div class='quiz-question'><p class='q-text'>"+d[i].q+"</p><div class='quiz-options'>";
    for(var j=0;j<d[i].o.length;j++){
      h+="<label><input type='radio' name='q"+n+"_"+i+"' value='"+j+"'><span>"+d[i].o[j]+"</span></label>";
    }
    h+="</div><div class='quiz-feedback' id='feedback-"+n+"-"+i+"'></div></div>";
  }
  c.innerHTML=h;
}

function checkQuiz(n){
  var d=qs[n];
  var c=0;
  
  for(var i=0;i<d.length;i++){
    var s=document.querySelector("input[name='q"+n+"_"+i+"']:checked");
    var feedbackEl=document.getElementById("feedback-"+n+"-"+i);
    
    // Resetear clases
    feedbackEl.className = "quiz-feedback";
    
    if(s&&parseInt(s.value)===d[i].a){
      c++;
      feedbackEl.classList.add("correct");
      feedbackEl.innerHTML="<strong>✦ Correcto</strong>" + (d[i].exp ? "<br>"+d[i].exp : "");
    }else{
      feedbackEl.classList.add("incorrect");
      var correctAns=d[i].o[d[i].a];
      feedbackEl.innerHTML="<strong>❧ Incorrecto</strong> — La respuesta correcta es: <em>"+correctAns+"</em>" + (d[i].exp ? "<br>"+d[i].exp : "");
    }
  }
  
  var p=Math.round(c/d.length*100);
  var r=document.getElementById("result-"+n);
  r.classList.add("show");
  
  if(p>=70){
    r.className="quiz-result show pass";
    r.innerHTML="❧ Excelente! "+c+"/"+d.length+" ("+p+"%) — Aprobado";
  }else{
    r.className="quiz-result show fail";
    r.innerHTML="❧ Obtuviste "+c+"/"+d.length+" ("+p+"%) — Repasar";
  }
}