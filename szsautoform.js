//填写表单
function test() {
	const val = 
	val.forEach((item)=>{
	if(item.val){
		
		document.querySelectorAll('.btn-plus')[0].click()
		document.querySelectorAll('.input-group')[1].querySelector('input').value = item.val && item.val.split('#')[0]
		var event = new UIEvent('change');
		document.querySelectorAll('.input-group')[1].querySelector('input').dispatchEvent(event);
		document.querySelectorAll('.input-group')[1].querySelectorAll('input')[1].value = `${item.key}论坛`}
		var event = new UIEvent('change');
		document.querySelectorAll('.input-group')[1].querySelectorAll('input')[1].dispatchEvent(event);
	})

}

//获取汽车之家网址
function test () {
    const name1 = Array.from(document.querySelectorAll('li div:nth-last-child(1) a:nth-last-child(2)')).map((item)=>{
      return `${item.href}`
    })
  const key = Array.from(document.querySelectorAll('li h4 a')).map((item)=>{
    return item.textContent
  })
  
    let result =[]
      for(var i = 0;i<key.length;i++){
          result.push({
              key: key[i],
              val: name1[i]
          })
      }
      return JSON.stringify(result)
  }