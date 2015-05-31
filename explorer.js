/**
* Explorer
*/
var App = App || {};

App.Explorer = (function(){
	var self = {};
	var content;
	self.open = new Array();
	var projectPath = undefined;
	var currentAjax = {};
	
	self.closeMenu = function(menu) {
		menu.hide();
	}
	
	self.onClick = function(event){
		if(event.which != 1)
			return;
		
		event.stopPropagation();
		
		if(App.Explorer.Contextual.currentOpen != "")	
			App.Explorer.closeMenu($(".contextual"));
		
		//event.preventDefault();
		var item = $(this);
		
		if(item.attr("data-type") == ""){
			var found = false;
			for(var i = 0; i < self.open.length; i++){
				if(self.open[i].path == item.attr("data-path")){
					found = true;
					break;
				}
			}
			
			item.removeClass();
			item.addClass("explorer-item");
			if(found){
				item.children("ul").toggle();
				
				if(item.children("ul").is(":visible")){
					item.addClass("explorer-folder-open");
				}
				else
					item.addClass("explorer-folder-close");
			}			
			else {
				self.getFolder(item, item.attr("data-path"));
				item.addClass("explorer-folder-open");
			}	
		}
		else {
			//ouverture de fichier
			self.openFile(item.attr("data-path") + "." + item.attr("data-type"), item.attr("data-type"));
		}	
	}

	function createHtml(block, result, path){
	
		self.open.push({path: path, item: block});
		var ul = $(document.createElement("ul"));
		
		for (var i = 0; i < result.length; i++){
			var li = $(document.createElement("li"));
			var span = document.createElement("span");
			li.addClass("explorer-item");
			
			if(result[i].type != ""){
				li.addClass("explorer-file-close");
				span.innerHTML = result[i].name + "." + result[i].type;
			}
			else { 
				li.addClass("explorer-folder-close");
				self.addDragDropStatus(li);
				span.innerHTML = result[i].name;
			}
			li.attr("data-path", path+"/"+result[i].name);
			li.attr("data-type", result[i].type);
			li.attr("draggable", true);
			
			if(li.attr("data-path") === projectPath+"/website"){
				li.attr("draggable", false);
				li.attr("data-root", "website");
			}
			
			li.on("dragstart", App.Explorer.DragDrop.dragstart);
			li.append(span);
			li.click(self.onClick);
			li.mouseup(App.Explorer.Contextual.onRightClick);
			
			ul.append(li);
		}
		block.append(ul);
	}
	
	self.addDragDropStatus = function(element){
		element.on("dragover", App.Explorer.DragDrop.dragover);
		element.on("drop", App.Explorer.DragDrop.drop);
		element.on("dragenter", App.Explorer.DragDrop.dragEnter);
		element.on("dragleave", App.Explorer.DragDrop.dragLeave);
		element.on("dragend", App.Explorer.DragDrop.dragEnd);
	};
	
	
	
	self.init = function(p_content, p_path){
		content = p_content;
		projectPath = p_path;
		
		self.getFolder(content, p_path);
		
		App.Explorer.Contextual.init($('body'));
	};
	
	self.refreshProject = function(){
		content.empty();
		self.open = new Array();
		
		self.getFolder(content, projectPath);
	};
	
	self.getFolder = function(block, path){
		
		if(currentAjax[path] == undefined)
		{
			currentAjax[path] = true;
			$.ajax({
				url: "js/ajax/explorer.php",
				type: "GET",
				data: {action: path},
				dataType: "json",
				success: function(result){
					createHtml(block, result, path);
					delete currentAjax[path];
				},
				error: function(){
					console.log('error');
				}
			});	
		}
	};
	
	self.openFile = function(path, ext){
		//App.Editor.Edit.requestLoading(path, ext);
		App.NodeClient.Editor.openFile(path, ext);
	};
	
	return self;
})();


App.Explorer.Contextual = (function(){
	var self = {};
	var menuFile = undefined;
	var menuFolder = undefined;
	var menuWebsite = undefined;
	self.currentPath = undefined;
	
	var actionWebsite = {"rafraichir": "refresh", "ajouter dossier": "add-folder", "ajouter fichier": "add-file", "download": "download",
		"propriétés": "properties"};
	var actionFolder = {"renommer": "renameFolder", "supprimer": "suppress", "ajouter dossier": "add-folder", "ajouter fichier": "add-file", "download": "download",  "propriétés": "properties"};
	var actionFile = {"renommer": "renameFile", "download": "download", "supprimer":"suppress", "propriétés": "properties"};
	
	self.currentOpen = "";
	
	self.init = function(content, path){
		
		content.bind("contextmenu", function(event){
			//event.preventDefault();
			return false;
		});
		
		menuFolder = $(document.createElement("ul")); 
		menuFile = $(document.createElement("ul"));
		menuWebsite = $(document.createElement("ul"));
		
		for(var i in actionFolder){
			var li = $(document.createElement("li"));
			li.html(i); 
			$(li).data("menuName", actionFolder[i]);

			li.click(App.Explorer.Contextual.Actions.dispatcher); 
		
			menuFolder.append(li);
		}
		menuFolder.addClass("contextual");
		content.append(menuFolder);
		
		for(var i in actionFile){
			var li = $(document.createElement("li"));
			li.html(i);
			$(li).data("menuName", actionFile[i]);
			
			li.click(App.Explorer.Contextual.Actions.dispatcher); 
			menuFile.append(li);
		}
		menuFile.addClass("contextual");
		content.append(menuFile);
		
		for(var i in actionWebsite){
			var li = $(document.createElement("li"));
			li.html(i);
			$(li).data("menuName", actionWebsite[i]);
			li.click(App.Explorer.Contextual.Actions.dispatcher); 
			menuWebsite.append(li);
		}
		menuWebsite.addClass("contextual");
		content.append(menuWebsite);	
		
		content.click(function(event){
			App.Explorer.closeMenu(menuFile);
			App.Explorer.closeMenu(menuFolder);
			App.Explorer.closeMenu(menuWebsite);	
		});	
	};
	
	self.onRightClick = function(event){
		if (event.which != 3)
			return;
			
		event.stopPropagation();
		App.Explorer.closeMenu($(".contextual"));
		
		var relativePosition = getRelativePosition(event, $(this));	
		menuFolder.css({"left": relativePosition.left, "top": relativePosition.top});
		menuFile.css({"left": relativePosition.left, "top": relativePosition.top});
		menuWebsite.css({"left": relativePosition.left, "top": relativePosition.top});
		
		if($(this).attr("data-root") !== undefined){
			self.currentPath = $(this).attr("data-path");
			menuWebsite.slideDown();
			
			currentOpen = menuWebsite;
		
			return false;
		}
		else if($(this).attr("data-type") == ""){
			self.currentPath = $(this).attr("data-path");
			menuFolder.slideDown();
			
			currentOpen = menuFolder;
		
			return false;
		}
		else
		{
			menuFile.slideDown();
			self.currentPath = $(this).attr("data-path")+'.'+$(this).attr("data-type");
			self.currentOpen = menuFile;
			return false;
		}
	}

	function getRelativePosition(event, element){
		var result = {};
		var offset = element.offset();
		result.left = event.pageX;
		result.top = event.pageY;
		return result;
	}
	
	return self;
})();


App.Explorer.Contextual.Actions = (function(){
	var self = {};
	
	self.dispatcher = function(){
		
		var menuName = $(this).data("menuName");

		var url = App.Explorer.Contextual.currentPath.split("/");
		var shortName = url[url.length-1];
		
		switch (menuName) {
			case "renameFile":
				App.Dialog.add($('body'), {
					content: "<h4>Renommer un élement</h4><p>Attention aux signes \", /, \, *, ?, <, >, |</p>"+
					'<p>N\'oubliez pas de spécifier l\'extension</p>'+
					'<form><input id="contextual-rename" type="text" name="new-name" class="custom-input" value="'+shortName+'"/></form>', 
					align: "center",
					buttons: [{type: 'alert', title: "Confirmer", callback: renameFile}, {type: 'normal', title: "Annuler"}] 
					});
			break;
			
			case "renameFolder":
				App.Dialog.add($('body'), {
					content: "<h4>Renommer un élement</h4><p>Attention aux signes \", /, \, *, ?, <, >, |</p>"+
					'<p>Ne spécifiez pas d\'extension</p>'+
					'<form><input id="contextual-rename" type="text" name="new-name" class="custom-input" value="'+shortName+'"/></form>', 
					align: "center",
					buttons: [{type: 'alert', title: "Confirmer", callback: renameFolder}, {type: 'normal', title: "Annuler"}] 
					});
			break;
	
			case "suppress": 
				App.Dialog.add($('body'), {
					content: "<h4>Supprimer un élement</h4><p>Attention, la suppression d'un dossier entraîne la suppression de tous les éléments qu'il contient.</p>"+
					'<p>Etes-vous sûr(e) de vouloir supprimer <strong>'+shortName+'</strong>?</p>', 
					align: "center",
					buttons: [{type: 'alert', title: "Confirmer", callback: suppress}, {type: 'normal', title: "Annuler"}] 
					});
				break;
			
			case "properties":
				$.ajax({
					url:"js/ajax/explorer_contextual_actions.php",
					type: "GET",
					data: {action: "getProperties", path: App.Explorer.Contextual.currentPath},
					dataType: "text",
					success: function(result){
						getProperties(result, shortName);
						},
					error: function(){
						console.log('error');
					}
				});
				break;
			
			case "add-file":
				App.Dialog.add($('body'), {
					content: "<h4>Ajout d'un nouveau fichier dans le dossier <strong>"+shortName+"</strong></h4>"+
					'<p>Veuillez spécifier le nom du nouveau fichier</p>'+
					'<p>N\'utilisez pas de caractères spéciaux, l\'application se charge d\'inserer les / qui définissent le répertoire</p>'+
					'<form><input id="new_file_creation" type="text" name="new-file" class="custom-input"/></form>', 
					align: "center",
					buttons: [{type: 'alert', title: "Ajouter", callback: addFile}, {type: 'normal', title: "Annuler"}] 
					});
				break;
			
			case "add-folder":
				App.Dialog.add($('body'), {
					content: "<h4>Ajout d'un nouveau dossier dans le dossier <strong>"+shortName+"</strong></h4>"+
					'<p>Veuillez spécifier le nom du nouveau dossier</p>'+
					'<p>N\'utilisez pas de caractères spéciaux, l\'application se charge d\'inserer les / qui définissent le répertoire</p>'+
					'<form><input id="new_folder_creation" type="text" name="new-folder" class="custom-input"/></form>', 
					align: "center",
					buttons: [{type: 'alert', title: "Ajouter", callback: addFolder}, {type: 'normal', title: "Annuler"}] 
					});
				break;
				
			case "upload":		
				App.Dialog.add($("body"), { 
					content: "<h4>Uploader un fichier</h4><p><form enctype='multipart/form-data'><input type='file' name='upload-file' /></form></p>",
					align: "center",
					buttons: [{type: 'normal', title: "Valider", callback: App.Editor.Edit.uploadElement}, {type: 'alert', title: "Annuler"}]
				});
				break;
			
			case "refresh":
				App.Explorer.refreshProject();
				break;
			
			case "download":
				$.ajax({
					url:"js/ajax/zipper.php",
					type: "GET",
					data: {action: "zip", path: App.Explorer.Contextual.currentPath},
					dataType: "json",
					success: function(result){
						window.open('uploads/index.php?uri='+result.uri+'&path='+result.path, '_blank');
						},
					error: function(){
						console.log('error'); 
					}
				});
				break;
			
			
			
			default: 
				break;
		}
	}
	
	function renameFile(){
		var input = $('#contextual-rename');
		var newName = input.val();
		var regex = /^[a-zA-Z0-9._-]+\.[a-z]{2,6}$/;
		var test = regex.test(newName);
		if(test){
			ajaxRename(newName);
			App.Dialog.remove();
		}
	}
		
	function renameFolder(){
		var input = $('#contextual-rename');
		var newName = input.val();
		var regex = /^[a-zA-Z0-9_-]+$/;
		var test = regex.test(newName);
		if(test){
			ajaxRename(newName);
			App.Dialog.remove();
		}
	}
			
	function ajaxRename(newName){
		$.ajax({
			url: "js/ajax/explorer_contextual_actions.php",
			type: "POST", 
			data: {action: "changeName", path: App.Explorer.Contextual.currentPath, newName: newName},
			dataType: "json",
			success: function(result){
				App.NodeClient.Explorer.renameElement(App.Explorer.Contextual.currentPath, result.path);
			},
			error: function(){
				console.log('error');
			}
		});		
	}
		
	function suppress(){
		$.ajax({
			url: "js/ajax/explorer_contextual_actions.php",
			type: "POST", 
			data: {action: "suppress", path: App.Explorer.Contextual.currentPath},
			dataType: "text",
			success: function(result){
				App.NodeClient.Explorer.deleteFile(App.Explorer.Contextual.currentPath);
				return true;
			},
			error: function(){
				console.log('error');
			}
		});
		App.Dialog.remove();
	}	
			
	function getProperties(element, shortName){
		var properties = JSON.parse(element);
		
		App.Dialog.add($('body'), {
			content: '<h4>Propriétés de '+shortName+'</h4><div class="properties"><ul>'+
			'<li><strong>Catégorie</strong> '+properties["category"]+'</li>'+
			'<li><strong>Extension</strong> '+properties["fileExt"]+'</li>'+
			'<li><strong>Taille</strong> '+properties["size"]+' octets</li>'+
			'<li><strong>Dernière ouverture</strong> '+properties["lastOpened"]+'</li>'+
			'<li><strong>Dernière modification</strong> '+properties["lastModified"]+'</li>'+
			'<li><strong>Droits sur l\'élément</strong> '+properties["rights"]+'</li></ul>',
			align: "center",
			buttons: [{type: 'alert', title: "OK"}] 
			});
	}
		
	function addFile(){
		var input = $("#new_file_creation");
		var newFileName = input.val();
			
		$.ajax({
			url: "js/ajax/explorer_contextual_actions.php",
			type: "POST", 
			data: {action: "createFile", path: App.Explorer.Contextual.currentPath, newFileName: newFileName},
			dataType: "text",
			success: function(result){
				App.NodeClient.Explorer.addFile(result);
				return true;
			},
			error: function(){
				console.log('error');
			}
		});
		App.Dialog.remove();
	}
		
	function addFolder(){
		var input = $("#new_folder_creation");
		var newFolderName = input.val();
	
		$.ajax({
			url: "js/ajax/explorer_contextual_actions.php",
			type: "POST", 
			data: {action: "createFolder", path: App.Explorer.Contextual.currentPath, newFolderName: newFolderName},
			dataType: "text",
			success: function(result){
				App.NodeClient.Explorer.addFolder(result);
				return true;
			},
			error: function(){
				console.log('error');
			}
		});
		App.Dialog.remove();
	}
	return self;
})();

App.Explorer.DragDrop = (function(){
	var self = {};
	var draggedElement;

	self.dragover = function(event){
		event.preventDefault();//annule l'interdiction par défaut du drop d'élément
		event.stopPropagation(); 
		
		if(event.originalEvent.clientY < 100)
			 $("#explorer").mCustomScrollbar("scrollTo","first"); 
		if(event.originalEvent.clientY > 200 && event.originalEvent.clientY < 300)
			 $("#explorer").mCustomScrollbar("scrollTo",100); 	 
		if(event.originalEvent.clientY > 370)
			 $("#explorer").mCustomScrollbar("scrollTo","last"); 
	};

	self.dragstart = function(event){
		event.stopPropagation(); 
		draggedElement = $(this);
		event.originalEvent.dataTransfer.setData("text/plain", draggedElement.attr("data-path")+draggedElement.attr("data-type")); 
	};

	self.drop = function(event){
		event.preventDefault();
		event.stopPropagation(); 
		if(draggedElement.attr("data-type") == "")
			var elementUrl = draggedElement.attr("data-path")
		else 
			var elementUrl = draggedElement.attr("data-path")+"."+draggedElement.attr("data-type");
		
		var targetUrl = $(this).attr("data-path");
		if(targetUrl != elementUrl){
			$.ajax({
				url: "js/ajax/explorer_contextual_actions.php",
				type: "POST", 
				data: {action: "dragDrop", targetFolder: targetUrl, movingElement: elementUrl},
				dataType: "text",
				success: function(result){
					App.NodeClient.Explorer.dragDropFile(elementUrl, result);	
				},
				error: function(){
					console.log('error');
				}
			});
		}
	}

	self.dragEnter = function(event){
		event.preventDefault();
		$(this).addClass("dragover");
	}
	
	self.dragLeave = function(event){
		event.preventDefault();
		$(this).removeClass("dragover");
	}
	
	self.dragEnd = function(event){
		event.preventDefault();
		draggedElement = "";
	}
return self;
})();


App.Explorer.Refresh = (function(){
	var self = {};
	
	function getParentPath(slashedUrl){
			var path;
			var result = new Array();
			for(var i = 0;  i< slashedUrl.length; i++){
				if(slashedUrl[i+1] !== undefined)
					result[i] = slashedUrl[i];
			}
			path = result.join("/");
			return path;
	} 

	function getNoExtPath(slashedUrl, element){
		
		var path;
		var tempResult = new Array();
		
		for(var i = 0;  i< slashedUrl.length; i++){
			if(slashedUrl[i] !== undefined)
				tempResult[i] = slashedUrl[i];
		}
	
		var tempPath = tempResult.join("/");
		
		var checkDot = tempPath.lastIndexOf(".");
		if(checkDot != -1)
			path = tempPath.substr(0, checkDot);
		else
			path = tempPath;
		
		return path;
	}
	
	function getExtension(element){
		
		var ext;
		var temp = element.lastIndexOf(".");
		if(temp != -1)
			ext = element.substr(temp+1, element.length - temp);
		else
			ext = "";
		return ext;
	}
	
	self.localRefresh = function(action, data){

		if(action == "add-file" || action == "add-folder"){
			var slashNewSplit = data.addPath.split("/");
			var newElement = slashNewSplit[slashNewSplit.length-1];
			//obligation de la stocker dans une variable; l'opération est plus longue que celles qui nécessitent cette donnée => bug
			
			var newer = new Object;
			newer.loneElementName = newElement;
			newer.parentCompletePath = getParentPath(slashNewSplit);
			newer.noExtPath = getNoExtPath(slashNewSplit, newElement);
			newer.extension = getExtension(newElement);	
			
			var check = false;
			for(var i = 0; i < App.Explorer.open.length; i++){
				if(App.Explorer.open[i].path == newer.parentCompletePath){
					check = true;
					break;
				}
			}
			if(check == false)
				return;
			
			var updatedElement = $(document.createElement("li"));	
			var span = document.createElement("span")

			if(newer.extension != ""){
				updatedElement.addClass("explorer-file-close");
				span.innerHTML = newer.loneElementName;
			}
			else { 
				updatedElement.addClass("explorer-folder-close");
				updatedElement.on("dragover", App.Explorer.DragDrop.dragover);
				updatedElement.on("drop", App.Explorer.DragDrop.drop);
				updatedElement.on("dragenter", App.Explorer.DragDrop.dragEnter);
				updatedElement.on("dragleave", App.Explorer.DragDrop.dragLeave);
				updatedElement.on("dragend", App.Explorer.DragDrop.dragEnd);
				span.innerHTML = newer.loneElementName;
			}
			updatedElement.attr("data-path", newer.noExtPath);
			updatedElement.attr("data-type", newer.extension);
			updatedElement.addClass("explorer-item");
			updatedElement.attr("draggable", true);
			
			updatedElement.on("dragstart", App.Explorer.DragDrop.dragstart);
			updatedElement.append(span);
			updatedElement.click(App.Explorer.onClick);
			updatedElement.mouseup(App.Explorer.Contextual.onRightClick);
			
			var targetParent = $(document).find("[data-path='"+newer.parentCompletePath+"']");
			var updatedPath = $(updatedElement).attr("data-path");	
			
			insertElement(updatedElement, targetParent, updatedPath);		
		}
		else if(action == "delete"){
			var slashOldSplit = data.deletePath.split("/");
			var oldElement = slashOldSplit[slashOldSplit.length-1];
			
			var older = new Object;
			older.parentCompletePath = getParentPath(slashOldSplit);
			older.noExtPath = getNoExtPath(slashOldSplit, oldElement);
			
			if(!App.Explorer.open.indexOf(older.parentCompletePath))
				return;
	
			var removedElement = $(document).find("[data-path='"+older.noExtPath+"']");
			removedElement.remove();
		}
		else if (action == "rename"){
			var slashOldSplit = data.oldPath.split("/");
			var oldElement = slashOldSplit[slashOldSplit.length-1];
	
			var slashNewSplit = data.newPath.split("/");
			var newElement = slashNewSplit[slashNewSplit.length-1];
		
			var older = new Object;
			older.loneElementName = oldElement;
			older.parentCompletePath = getParentPath(slashOldSplit);
			older.noExtPath = getNoExtPath(slashOldSplit, oldElement);
			older.extension = getExtension(oldElement);	
			
			var newer = new Object;
			newer.loneElementName = newElement;
			newer.parentCompletePath = getParentPath(slashNewSplit);
			newer.noExtPath = getNoExtPath(slashNewSplit, newElement);
			newer.extension = getExtension(newElement);	
		
			if(!App.Explorer.open.indexOf(older.parentCompletePath) && !App.Explorer.open.indexOf(newer.parentCompletePath))
				return;
				
			var removedElement = $(document).find("[data-path='"+older.noExtPath+"']");
			var updatedElement = removedElement.clone();
			removedElement.remove();
			
			updatedElement.unbind();
			updatedElement.attr("data-path", newer.noExtPath);
			updatedElement.attr("data-type", newer.extension);
			updatedElement.children("span").empty();
			updatedElement.children("span").html(newer.loneElementName);
			updatedElement.addClass("explorer-item");
			updatedElement.attr("draggable", true);
			updatedElement.on("dragstart", App.Explorer.DragDrop.dragstart);
		
			updatedElement.click(App.Explorer.onClick);
			updatedElement.mouseup(App.Explorer.Contextual.onRightClick);
			
			if(updatedElement.attr("data-type") == "")
			{
				updatedElement.addClass("explorer-folder-close");
				App.Explorer.addDragDropStatus(updatedElement);
			}
			
			var targetParent = $(document).find("[data-path='"+newer.parentCompletePath+"']");
			var updatedPath = $(updatedElement).attr("data-path");
			
			insertElement(updatedElement, targetParent, updatedPath);		
		
		}
		else if(action == "drag-drop"){
			var slashOldSplit = data.filePath.split("/");
			var oldElement = slashOldSplit[slashOldSplit.length-1];
			
			var slashNewSplit = data.destinationPath.split("/");
			var newElement = slashNewSplit[slashNewSplit.length-1];
			
			var older = new Object;
			older.loneElementName = oldElement;
			older.parentCompletePath = getParentPath(slashOldSplit);
			older.noExtPath = getNoExtPath(slashOldSplit, oldElement);
			older.extension = getExtension(oldElement);	
			
			var newer = new Object;
			newer.loneElementName = newElement;
			newer.parentCompletePath = getParentPath(slashNewSplit);
			newer.noExtPath = getNoExtPath(slashNewSplit, newElement);
			newer.extension = getExtension(newElement);	
			
			var removedElement = $(document).find("[data-path='"+older.noExtPath+"']");
			var updatedElement = removedElement.clone();
			
			if(App.Explorer.open.indexOf(older.parentCompletePath))
				removedElement.remove();
			
			updatedElement.unbind();
			updatedElement.attr("data-path", newer.noExtPath);
			updatedElement.attr("data-type", newer.extension);
			updatedElement.children("span").empty();
			updatedElement.children("span").html(newer.loneElementName);
			updatedElement.addClass("explorer-item");
			updatedElement.attr("draggable", true);
			
			updatedElement.on("dragstart", App.Explorer.DragDrop.dragstart);
			updatedElement.click(App.Explorer.onClick);
			updatedElement.mouseup(App.Explorer.Contextual.onRightClick);
			
			
			if(updatedElement.attr("data-type") == ""){
				App.Explorer.addDragDropStatus(updatedElement);
			}
			
			var targetParent = $(document).find("[data-path='"+newer.parentCompletePath+"']");
			var updatedPath = $(updatedElement).attr("data-path");
			for(var i = 0; i < App.Explorer.open.length; i++){
				if(App.Explorer.open[i].path == newer.parentCompletePath){
					insertElement(updatedElement, targetParent, updatedPath);
					break;
				}
			}
		}
	}
	
	function insertElement(updatedElement, targetParent, updatedPath){
		var kids = targetParent.find("ul:first > li");
		
		if(kids.length == 0){
			var ul = $(document.createElement("ul"));
			ul.append(updatedElement);
			targetParent.append(ul);
		}
		else if(updatedElement.attr("data-type") == ""){
			for(var i = 0; i < kids.length; i++)
			{
				var current = { type: $(kids[i]).attr("data-type"), path: $(kids[i]).attr("data-path") };
				
				if(current.path < updatedPath){
					if(current.type == "")
						continue;
					else if(current.type != ""){
						$(kids[i]).before($(updatedElement));
						break;
					}
				}
				else if(current.path > updatedPath){
					$(kids[i]).before($(updatedElement));
					break;
				}
				else{
					$(kids[i]).after($(updatedElement));
					break;
				}
			}
		}
		else {
			for(var i = 0; i < kids.length; i++)
			{
				var current = { type: $(kids[i]).attr("data-type"), path: $(kids[i]).attr("data-path") };
				
				if(kids[i+1] === undefined){
					if(current.type == "")
						$(kids[i]).after(updatedElement);
					else {  
						if(current.path < updatedPath)
							$(kids[i]).after(updatedElement);
						else 
							$(kids[i]).before(updatedElement);
					}
					break;
				}
				
				if(current.type == "" || current.path < updatedPath)
					continue;
					
				if(current.path > updatedPath){
					$(kids[i]).before(updatedElement);
					break;
				}
			}
		}
	}

return self;
})();