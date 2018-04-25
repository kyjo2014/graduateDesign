const fs = require('fs')



fs.writeFile('./cars/test.json', JSON.stringify({'李天惠':123}),function(){})