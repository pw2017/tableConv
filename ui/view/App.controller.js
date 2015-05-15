//To use a javascript controller its name must end with .controller.js
sap.ui.controller("view.App", {
	tablesJSON : null,	
    onInit: function(){
    	 var view = this.getView();
         view.addStyleClass("sapUiSizeCompact"); // make everything inside this View appear in Compact mode
         view.byId("Schema").setFilterFunction(this.getView().getController().filterFunction);
         view.byId("Table").setFilterFunction(this.getView().getController().filterFunction);    	
    },

    filterFunction: function(sTerm, oItem) {
        if (sTerm === "*") {
            return true;
        } else {
            return jQuery.sap.startsWithIgnoreCase(oItem.getText(), sTerm);
        }
    },

    escapeHtml: function(string) {
        var entityMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
           "\"": "&quot;",
            "'": "&#39;",
            "/": "&#x2F;",
            "{": "&#123;",
            "}": "&#125"
        };

        return String(string).replace(/[&<>"'\/{}]/g, function(s) {
            return entityMap[s];
        });
    }, 
    
    logout: function() {
        var aUrl = "/sap/hana/xs/formLogin/token.xsjs";
        jQuery.ajax({
            url: aUrl,
            method: 'GET',
            dataType: 'text',
            beforeSend: function(jqXHR) {
                jqXHR.setRequestHeader('X-CSRF-Token', 'Fetch');
            },
            success: function(arg1, arg2, jqXHR) {
                var aUrl = "/sap/hana/xs/formLogin/logout.xscfunc";
                jQuery.ajax({
                    url: aUrl,
                    type: 'POST',
                    dataType: 'text',
                    beforeSend: function(jqXHR1, settings) {
                        jqXHR1.setRequestHeader('X-CSRF-Token', jqXHR.getResponseHeader('X-CSRF-Token'));
                    },
                    success: function() {
                        location.reload();
                    },
                    error: function() {

                    }
                });

            },
            error: function() {

            }
        });
    },
  
	onConversionDisplay: function(){
		var oController = this.getView().getController();
		var oModel = sap.ui.getCore().getModel();
		var table = oModel.getProperty("/Table");
		var schema = oModel.getProperty("/Schema");
		var UrlHDBDD = ShortUrl + '?cmd=getHDBDD'; 
		var UrlHDBTABLE = ShortUrl + '?cmd=getHDBTABLE'; 
		
		for( var i = 0; i<oController.tablesJSON.length; i++){
			if(oController.tablesJSON[i].TABLE_NAME===table){
				UrlHDBDD += '&table_oid=' + escape(oController.tablesJSON[i].TABLE_OID);
				UrlHDBTABLE += '&table_oid=' + escape(oController.tablesJSON[i].TABLE_OID);
			}
		}

		jQuery.ajax({
			url : UrlHDBDD,
			method : 'GET',
			dataType : 'text',
			success : oController.onInsertHDBDD,
			error : oController.onErrorCall	});
		jQuery.ajax({
			url : UrlHDBTABLE,
			method : 'GET',
			dataType : 'text',
			success : oController.onInsertHDBTABLE,
			error : oController.onErrorCall	});		
	},
	
	 onInsertHDBDD: function(myTXT) {
			var oController = sap.ui.getCore().byId("app").getController();
			 var html = new sap.ui.core.HTML({
		            // static content
		            content: "<div id=\"content1\" class=\"wiki\"><div class=\"code\"><pre>" + oController.escapeHtml(myTXT) + "\n" + "</pre></div></div>",
		            preferDOM: false
		        });			
			 sap.ui.getCore().byId("app").byId("CDSTABLEPanelContent").removeAllContent();
			 sap.ui.getCore().byId("app").byId("CDSTABLEPanelContent").addContent(html);
		},
	
		 onInsertHDBTABLE: function(myTXT) {
				var oController = sap.ui.getCore().byId("app").getController();
				 var html = new sap.ui.core.HTML({
			            // static content
			            content: "<div id=\"content1\" class=\"wiki\"><div class=\"code\"><pre>" + oController.escapeHtml(myTXT) + "\n" + "</pre></div></div>",
			            preferDOM: false
			        });	
				 sap.ui.getCore().byId("app").byId("HDBTABLEPanelContent").removeAllContent();
				 sap.ui.getCore().byId("app").byId("HDBTABLEPanelContent").addContent(html);
			},
			
	 //Schema Filter
	 loadSchemaFilter: function(oEvent){
		   var oController = this.getView().getController();
		   var gSearchParam = oEvent.getParameter("suggestValue");
		   if(typeof(gSearchParam) != 'undefined'){
			   if(gSearchParam == "*"){gSearchParam="";}
		   }
		   else{ gSearchParam = "";}	
		    var aUrl = ShortUrl + '?cmd=getSchemas&schema='+escape(gSearchParam);
		    jQuery.ajax({
		       url: aUrl,
		       method: 'GET',
		       dataType: 'json',
		       success: oController.onLoadSchemaFilter,
		       error: oController.onErrorCall });
	 },	 
	 onLoadSchemaFilter: function(myJSON){
		  var oSearchControl = sap.ui.getCore().byId("app--Schema"); 
		  oSearchControl.destroySuggestionItems();
		  for( var i = 0; i<myJSON.length; i++)
		     {
			  oSearchControl.addSuggestionItem(new sap.ui.core.Item({
				  text: myJSON[i].SCHEMA_NAME
		     }));
	      }
	},
	 
		//Table Filter
		 loadTableFilter: function(oEvent){
			   var oController = this.getView().getController();
			   var oModel = sap.ui.getCore().getModel();			   
			   gSearchParam = oEvent.getParameter("suggestValue");
			   if(typeof(gSearchParam) != 'undefined'){
				   if(gSearchParam == "*"){gSearchParam="";}
			   }
			   else{ gSearchParam = "";}
			   
			   schemaName = oModel.getProperty("/Schema");
			    var aUrl = ShortUrl + '?cmd=getTables&schema='+escape(schemaName)+'&table='+gSearchParam;
			    jQuery.ajax({
			       url: aUrl,
			       method: 'GET',
			       dataType: 'json',
			       success: oController.onLoadTableFilter,
			       error: oController.onErrorCall });
		 },		 
		 onLoadTableFilter: function(myJSON){
			   var oController = sap.ui.getCore().byId("app").getController();
			   oController.tablesJSON = myJSON;
			  var oSearchControl = sap.ui.getCore().byId("app--Table");
			  oSearchControl.destroySuggestionItems();
			  for( var i = 0; i<myJSON.length; i++)
			     {
				  oSearchControl.addSuggestionItem(new sap.ui.core.Item({text: myJSON[i].TABLE_NAME}))

			     }
			},
			
	   onDownloadHDBTable: function(){
		   var oController = this.getView().getController();	
		   oController.onMassDownload('HDBTable');		   
	   },
			   
	   onDownloadHDBDD: function(){
		   var oController = this.getView().getController();
		   oController.onMassDownload('HDBDD');
	   },
	   
	   onMassDownload: function(type){
		    var oModel = sap.ui.getCore().getModel();
			var table = oModel.getProperty("/Table");
			var schema = oModel.getProperty("/Schema");			
			var UrlDownload = 'cmd=Download&schema='+escape(schema)+'&table='+table+'&type='+escape(type); 
			window.open(ShortUrl+'?'+UrlDownload);
			return;	
	   },    
    onErrorCall: function(jqXHR) {
        if (jqXHR.responseText === "NaN") {
            sap.m.MessageBox.alert("Invalid Input Value");
        } else {
            sap.m.MessageBox.alert(escape(jqXHR.responseText) );
        }
        return;
    }    
});