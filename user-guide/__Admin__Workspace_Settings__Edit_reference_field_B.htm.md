Edit reference field BR

Click here to see this page in full context

#####  Edit Reference field with Business Rules

If the Business Rules module is enabled, the category numbering defines the
allowable format of document filenames that can be uploaded using the
category. When the documents are uploaded, the reference is automatically
generated according to these category rules.Â

With Business Rules, category numbering is based on a limited set of part
types.

Part type  |  Description  |  Instructions   
---|---|---  
Separator  |  Characters which delineate the parts of the reference number. Separators may consist of one or two characters. They can be any type of character, but most often are symbol characters. For example - / [ ] .Â  |  Enter the characters that you want to be used for this separator part.   
Code Table  |  Allows the file name to be one of the options in a code table that is available for use in your workspace.Â  |  Enter the Name of the part.   
Select the Code Table from which the options will be chosen.  
General  |  Allows the file name to contain a piece of text as part of the reference number.  |  Enter the Name of the part.   
Enter the minimum and maximum character lengths that the name part can be in
the Min Length and Max Length fields.  
  
  

  1. In the Manage Document Fields tab, press the Preferences button for the Reference property. 
  2. If the category is deactivated and has not yet been used to upload documents, you can add, remove and configure the order of parts to create the reference number format. To add a part to the reference number, press the Insert Part button and select its location in the reference number, relative to any other parts.Â 
  3. To enforce the inclusion of any Business Rules numbering part, check the Mandatory box. Note If the reference number contains a mix of mandatory and optional elements, the non-mandatory parts must come at the end of the number. 
  4. By default, every part of the document filename will be included when the document reference is generated. You can disallow this for a part by checking the Not included in Reference box. 

Note  Disallowing a part from the reference is useful when you want to allow
the uploading of attachments, and the main document type and supporting
document type are the same (for example, .pdf). The Business Rules module
requires that the references for a document and its attachments are identical.
So, in such a case, there should be a non-mandatory part, not included in the
reference that allows the file names of uploaded documents to differentiate
between main and attachment.

For example, main: REPORT-1-.pdf, attachment: REPORT-1-ATT1.pdf. In this
scenario the third part of the naming structure is a general part that is left
blank in the main document and file name has the value ATT1 in the attachment
file name.

Note  A general part always requires a separator before and after it (unless
it is the only numbering part).

Note  If the character that is used for the separator is used within a code
table code, the system will not error when adding the value to the code table,
but a problem will occur when you upload a document. The system will not parse
the reference number correctly. It will recognize the separator value as the
end of that numbering part, and it will try to parse the value following the
separator as the next part.

Note  Variable numbers of digits are possible as long as the numbering part is
followed by a separator. (In other words, code tables require fixed values if
there is not a separator that follows the numbering part.)

Note  It is not possible to add more than one optional part for a category.  
When the documents are uploaded the main-attachment relationship will be
established and the reference for both documents will be: REPORT-1-.

  1. The Business Rules module allows you to associate a part with the Revision or Status metadata field. When a document with a valid file name is uploaded, the contents of the part will be inserted into the relevant metadata field. 

For example, if the document name is: REPORT-DRAFT.pdf, and the second part in
the numbering system is a code table in which DRAFT is a valid value and the
part is linked to the Status field, when the document is uploaded its Status
will automatically be set to DRAFT.

The Revision and Status field must already be configured with its Type set to
Link to Reference Part. The reference part must use a code table. If these two
requirements are met, the field will be available in the Link to Document
Field drop-down menu.

