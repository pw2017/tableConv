/**
@author i809764 
**/

$.import("sap.hana.xs.libs.dbutils","xsds");
var XSDS = $.sap.hana.xs.libs.dbutils.xsds;

var conn = $.hdb.getConnection();
var pstmt1;

/**
@function Reads a table and returns JSON
@param {string} tblName - Table Name
@returns {object} recordSetJSON object with the result set as JSON
*/
function getJSON(tblName){
	tblName = typeof tblName !== 'undefined' ? tblName : 'schemas'; 
	var table = XSDS.$defineEntity("table", tblName);
	
	
	return table.$query().execute();
}

/**
@function Executes a single statement in the database
@param {string} query - Query to send to DB
*/
function execute(query) {
	pstmt1 = conn.prepareStatement(query);
	pstmt1.execute();
}

/**  
@function Outputs the Session user and Language as JSON in the Response body
*/
function fillSessionInfo(){
	var body = '';
	body = JSON.stringify({
		"session" : [{"UserName": $.session.getUsername(), "Language": $.session.language}] 
	});
	$.response.contentType = 'application/json'; 
	$.response.setBody(body);
	$.response.status = $.net.http.OK;
}

/**
@function Puts a JSON object into the Response Object
@param {object} jsonOut - JSON Object
*/
function outputJSON(jsonOut){
	var out = [];
	for(var i=0; i<jsonOut.length;i++){
		out.push(jsonOut[i]);
	}
	$.response.status = $.net.http.OK;
	$.response.contentType = "application/json";
	$.response.setBody(JSON.stringify(out));
}

/**
@function Utility to build error message response
@param {string} input - Error message text
*/
function outputError(errorString){
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	$.response.contentType = "text/plain";
	$.response.setBody(errorString);	
}

/**
@function Get request parameter schema and select all Schemas matching that pattern
*/
function getSchemas(){
	var searchSchema = $.request.parameters.get("schema");
	if (typeof searchSchema === 'undefined') {
		searchSchema = "%";
	} else {
		searchSchema += "%";
	}
	
    var query = 'SELECT * from SCHEMAS ' +
    ' WHERE SCHEMA_NAME LIKE ? ' +
    ' ORDER BY SCHEMA_NAME ' +
    ' LIMIT 10 ';
    outputJSON(conn.executeQuery(query, searchSchema));
}

/**
@function Public function to read all tables and return JSON results
*/
function getTables(){
	
	outputJSON(getTablesInt(200));	
}

/**
@function Private function to read all tables and return JSON results; reads schema and table from request object
@param {optional Number} limit - Max number of Tables to read
@returns {object} jsonOut - JSON Object for return recordset
*/
function getTablesInt(limit){
	var searchSchema = $.request.parameters.get("schema");
	var searchTable = $.request.parameters.get("table");
	if (typeof searchTable === 'undefined') {
		searchTable = "%";
	} else {
		searchTable += "%";
	}

    var query = 'SELECT SCHEMA_NAME, TABLE_NAME, TO_NVARCHAR(TABLE_OID) AS TABLE_OID, COMMENTS  from TABLES ' +
    ' WHERE SCHEMA_NAME = ? ' +
    '   AND TABLE_NAME LIKE ? ' +
    ' ORDER BY TABLE_NAME ';
    if (limit != null){
		query += 'LIMIT ' + limit.toString();
	}

    var jsonOut = conn.executeQuery(query, searchSchema, searchTable);
	return jsonOut;
}

/**
@function Private function to read details of a single table and return JSON results
@param {Integer} table_oid - internal id for the table
@returns {object} jsonOut - JSON Object for return recordset
*/
function getTableInt(table_oid){

    var query = 'SELECT * from TABLES ' +
    ' WHERE TABLE_OID = ? ';
    var jsonOut = conn.executeQuery(query, table_oid);
    var out = [];
	for(var i=0; i<jsonOut.length;i++){
		out.push(jsonOut[i]);
	}
    return jsonOut;
}

/**
@function Public function to read details of a single table and return JSON results; Reads table_oid from request object
*/
function getTable(){
	var table_oid = $.request.parameters.get("table_oid");
	if(table_oid == null){
		outputError('Invalid source table');
		return;
	}
	outputJSON(getTableInt(table_oid));	
}

/**
@function Private function to read all fields of a tables and return JSON results
@param {String} table_oid - internal id for the table
@returns {object} jsonOut - JSON Object for return recordset
*/
function getFieldsInt(table_oid){
	
    var query = 'SELECT * from TABLE_COLUMNS ' +
    ' WHERE TABLE_OID = ? ' +
    ' ORDER BY POSITION ';
    var jsonOut = conn.executeQuery(query, table_oid);
    var out = [];
	for(var i=0; i<jsonOut.length;i++){
		out.push(jsonOut[i]);
	}
    return jsonOut;
}

/**
@function Public function to read all fields of a table and return JSON results; Reads table_oid from request object
*/
function getFields(){
	var table_oid = $.request.parameters.get("table_oid");
	if(table_oid == null){
		outputError('Invalid source table');
		return;
	}	
	outputJSON(getFieldsInt(table_oid));
}

/**
@function Private function to read contraints of a table and return JSON results
@param {String} schema - Schema Name
@param {String} table - Table Name
@returns {object} jsonOut - JSON Object for return recordset
*/
function getConstraintsInt(schema,table){
    var query = 'SELECT * from CONSTRAINTS ' +
    ' WHERE SCHEMA_NAME = ? ' +
    '   AND TABLE_NAME = ? ' +
    '   AND IS_PRIMARY_KEY = ? ' +
    ' ORDER BY POSITION ';
   
    var jsonOut = conn.executeQuery(query, schema, table, 'TRUE');
    var out = [];
	for(var i=0; i<jsonOut.length;i++){
		out.push(jsonOut[i]);
	}
    return jsonOut;
}

/**
@function Private function to read contraints of a table; Reads schema and table from request object
*/
function getConstraints(){
	var searchSchema = $.request.parameters.get("schema");
	if(searchSchema == null){
		outputError('Invalid search schema');
		return;
	}
	var searchTable = $.request.parameters.get("table");
	if(searchTable == null){
		outputError('Invalid search table');
		return;
	}
	outputJSON(getConstraintsInt(searchSchema,searchTable));	
}

/**
@function Public function to build a hdbtable syntax for a single table and place into resposne object; reads table_oid from request object
*/
function getHDBTABLE(){
	var hdbtable = '';
	var table_oid = $.request.parameters.get("table_oid");
	if(table_oid == null){
		outputError('Invalid source table');
		return;
	}
	
	hdbtable = getHDBTABLEInt(table_oid);	      
	                 
	$.response.status = $.net.http.OK;
	$.response.contentType = "text/plain";
	$.response.setBody(hdbtable);	
	
}

/**
@function Private function to build a hdbtable syntax for a single table
@param {String} table_oid - Internal ID for a table
@returns {String} hdbtable - Generated hdbtable syntax
*/
function getHDBTABLEInt(table_oid){
	var hdbtable = '';
	var tableJSON = getTableInt(table_oid);
	var fieldsJSON = getFieldsInt(table_oid);
	
	hdbtable =  'table.schemaName = "'+ tableJSON[0].SCHEMA_NAME + '";\n';
	if(tableJSON[0].IS_COLUMN_TABLE === 'TRUE'){
		hdbtable += 'table.tableType = COLUMNSTORE;\n';
	}else{
		hdbtable += 'table.tableType = ROWSTORE;\n';		
	}
	hdbtable += 'table.description = "'+ tableJSON[0].COMMENTS +'";\n';
	hdbtable += 'table.columns = [ \n';
	
	for ( var i = 0; i < fieldsJSON.length; i++) {
		hdbtable += '{name = "'+ fieldsJSON[i].COLUMN_NAME +'";';
		
		hdbtable += ' sqlType = '+ fieldsJSON[i].DATA_TYPE_NAME +';';
		
		if(fieldsJSON[i].IS_NULLABLE==='FALSE'){
			hdbtable += ' nullable = false;';
		}else{
			hdbtable += ' nullable = true;';			
		}

		if(fieldsJSON[i].SCALE>0){
			hdbtable += ' precision = '+ fieldsJSON[i].LENGTH +';';
			hdbtable += ' scale = '+ fieldsJSON[i].SCALE +';';			
		}else{
			hdbtable += ' length = '+ fieldsJSON[i].LENGTH +';';
		}
		
		if(fieldsJSON[i].DEFAULT_VALUE){
			hdbtable += ' defaultValue = "'+ fieldsJSON[i].DEFAULT_VALUE +'"; ';
		}
		
		if(fieldsJSON[i].COMMENTS===null){}
		else{
			hdbtable += ' comment = "'+ fieldsJSON[i].COMMENTS +'"; ';
		}
		
		if(i===fieldsJSON.length-1){
			hdbtable += ' }\n';
		}else{	
			hdbtable += ' },\n';
		}
	}
	hdbtable += '];\n';
	
	if(tableJSON[0].HAS_PRIMARY_KEY==='TRUE'){
		hdbtable += 'table.primaryKey.pkcolumns = [';
		var constraintsJSON = getConstraintsInt(tableJSON[0].SCHEMA_NAME,tableJSON[0].TABLE_NAME);
		for ( var i = 0; i < constraintsJSON.length; i++) {
			hdbtable += '"'+ constraintsJSON[i].COLUMN_NAME +'"';
			if(i===constraintsJSON.length-1){
			}else{	
				hdbtable += ',';
			}
		}
		hdbtable += '];\n';
	}
	
	return hdbtable;
}

/**
@function Public function to build a hdbdd syntax for a single table and place into response object; reads table_oid from request object
*/
function getHDBDD(){
	var cdstable = '';
	var table_oid = $.request.parameters.get("table_oid");
	if(table_oid == null){
		outputError('Invalid source table');
		return;
	}

	cdstable = getHDBDDInt(table_oid);
	
	$.response.status = $.net.http.OK;
	$.response.contentType = "text/plain";
	$.response.setBody(cdstable);	    
}

/**
@function Private function to build a hdbdd syntax for a single table
@param {String} table_oid - Internal ID for a table
@returns {String} cdstable - Generated hdbtable syntax
*/
function getHDBDDInt(table_oid){
	var cdstable = '';
	var tableJSON = getTableInt(table_oid);
	var fieldsJSON = getFieldsInt(table_oid);
	if(tableJSON[0].HAS_PRIMARY_KEY==='TRUE'){
		var constraintsJSON = getConstraintsInt(tableJSON[0].SCHEMA_NAME,tableJSON[0].TABLE_NAME);
	}
	
	if(tableJSON[0].IS_COLUMN_TABLE === 'TRUE'){
		cdstable += '@Catalog.tableType : #COLUMN\n';
	}else{
		cdstable += '@Catalog.tableType : #ROW\n';		
	}
	
	cdstable += 'Entity '+ tableJSON[0].TABLE_NAME + ' { \n';

	var isKey = 'FALSE';
	for ( var i = 0; i < fieldsJSON.length; i++) {
		cdstable += '\t\t';
		isKey = 'FALSE';
		if(tableJSON[0].HAS_PRIMARY_KEY==='TRUE'){
			for ( var i2 = 0; i2 < constraintsJSON.length; i2++) {
				if(fieldsJSON[i].COLUMN_NAME===constraintsJSON[i2].COLUMN_NAME){
					cdstable += 'key ';
					isKey = 'TRUE'; 
				}
			}
		}
		
		cdstable += fieldsJSON[i].COLUMN_NAME + ': ';
		
		switch (fieldsJSON[i].DATA_TYPE_NAME) {
			case "NVARCHAR":
				cdstable += 'String(' + fieldsJSON[i].LENGTH + ')';
				break;
			case "VARCHAR":
				cdstable += 'String(' + fieldsJSON[i].LENGTH + ')';
				break;				
			case "NCLOB":
				cdstable += 'LargeString';
				break;
			case "VARBINARY":
				cdstable += 'Binary(' + fieldsJSON[i].LENGTH + ')';
				break;	
			case "BLOB":
				cdstable += 'LargeBinary';
				break;	
			case "INTEGER":
				cdstable += 'Integer';
				break;					
			case "BIGINT":
				cdstable += 'Integer64';
				break;	
			case "DECIMAL":
				cdstable += 'Decimal(' + fieldsJSON[i].LENGTH + ', ' + fieldsJSON[i].SCALE + ')';
				break;	
			case "DOUBLE":
				cdstable += 'BinaryFloat';
				break;		
			case "DATE":
				cdstable += 'LocalDate';
				break;	
			case "TIME":
				cdstable += 'LocalTime';
				break;			
			case "SECONDDATE":
				cdstable += 'UTCDateTime';
				break;		
			case "TIMESTAMP":
				cdstable += 'UTCTimestamp';
				break;					
			default:	
				cdstable += 'hana.' + fieldsJSON[i].DATA_TYPE_NAME
				//cdstable += '**UNSUPPORTED TYPE - ' + fieldsJSON[i].DATA_TYPE_NAME;
			
		}
		
		if(fieldsJSON[i].DEFAULT_VALUE){
			cdstable += ' default "'+ fieldsJSON[i].DEFAULT_VALUE +'"';
		}
		

		if(fieldsJSON[i].IS_NULLABLE==='FALSE'){
			if(isKey==='FALSE'){
			 cdstable += ' not null';
			}	
		}
		else{
			if(isKey==='TRUE'){
			 cdstable += ' null';
			}
		}
		cdstable += '; ';
		
		if(fieldsJSON[i].COMMENTS===null){}
		else{
			cdstable += '// ' + fieldsJSON[i].COMMENTS;
		}
		
		cdstable += '\n';
	}

	cdstable += '};\n';
	return cdstable;
}

/**
@function Mass Download of either hdbtable or hdbdd syntax for one or more tables - builds response object as attachment; reads type from request object and tables from getTablesInt()
*/
function download(){
	var type = $.request.parameters.get("type");
	var TablesJSON = getTablesInt();
	var outString = '';
	for ( var i = 0; i < TablesJSON.length; i++) {
		switch (type) {
		case "HDBDD":
			outString += getHDBDDInt(TablesJSON[i].TABLE_OID.toString()) + '\n\n';			
			break;
		case "HDBTable":
			outString += '//Table Name: '+ TablesJSON[i].TABLE_NAME + '\n'+
				         getHDBTABLEInt(TablesJSON[i].TABLE_OID.toString()) + '\n\n';
			break;
		}
	}
	$.response.status = $.net.http.OK;
	$.response.contentType = "application/octet-stream";
	$.response.headers.set('Content-Disposition',
			'attachment; filename=Conversion'+type+'.txt');
	$.response.setBody(outString);
	
}
