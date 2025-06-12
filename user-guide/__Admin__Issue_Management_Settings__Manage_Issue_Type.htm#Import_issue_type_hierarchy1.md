Manage Issue Type

Click here to see this page in full context

###  Manage Issue Type

AccessÂ Â Â  
---  
Features enabledÂ  |  Issue Management   
Permissions  |  Issue Management Administrator and Workspace Administrator   
  
  
The Issue Management module allows users to raise issues according to a
hierarchy of issue types. The issue type hierarchy can be constructed manually
or imported via an Excel spreadsheet.

Issue types describe the type of issues that may be raised in a hierarchy of
specificity. For example, Level 1 might be Electrical, Level 2, Wiring, Level
3, Domestic Mains.

Each issue type in a hierarchy is identified by an issue type name and a
unique issue type code. The code can be used, for example, in reports and
issue numbering.

####  Import issue type hierarchyÂ

In order to import this information, each top-to-bottom hierarchical path must
be entered in a row of an Excel spreadsheet.

If you import a new hierarchy into a workspace where one already exists, the
existing one will be overwritten, along with default values. You can do this
as often as you want until an issue has been created against the hierarchy.
Once an issue exists, the import function will no longer be available.

  1. Open an Excel spreadsheet and rename Sheet1 as Issue Type Hierarchy. 
  2. In Row A enter Level1 Name in the first column and Level1 Code in the second column. Repeat for the subsequent column pairs, for as many levels as your hierarchy contains. 
  3. In each subsequent row, enter the issue type names and issue type codes that describe the top-to-bottom hierarchy. Note that where several rows contain the same issue type name/code pair, the code for only the first row needs to be filled in. The remaining matching rows will be assumed the same during the import.Â 

Note  Issue type code must be 1-5 characters and may consist of letters (A-z),
numbers (0-9) and the hyphen character (-). For example, HVAC.

  1. When you are finished, save the spreadsheet. 
  2. In FusionLive, in the Issue Management tab of the Administration page, select Manage Issue Type. 
  3. On the Manage Issue Type tab, click on Import. 
  4. Click on Choose File, locate the Excel document and press Open. 
  5. Press Import. 

