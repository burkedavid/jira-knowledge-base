Upload with Business Rules

Click here to see this page in full context

####  Upload with Business Rules

When the FusionLive Business Rules module is enabled, the upload process
validates the file names of the documents you are uploading against the
document reference numbering rules. See [ Edit Reference field with Business
Rules ](../Admin/Workspace_Settings/Edit_reference_field_B.htm#h) Â for more
information on how reference numbering rules are constructed. Contact your
workspace administrator for an explanation of the reference numbering rules
applied to your workspace.Â

By default, FusionLive allows you to select which users will be notified when
a document is uploaded into a category. If the Forced Alerting module is
enabled, administrators can make certain notification recipients mandatory,
although additional recipients can be added.

Note  The maximum file size for documents to upload is 9GB.

  1. On the Documents page, select a folder and press the Upload button on the menu bar.Â 
  2. Browse your local drive for documents you wish to upload, then press Open.Â 
  3. Select the relevant document category from the drop-down menu.Â 

In Business Rules workspaces, the documents selected for upload must belong to
the same category. Each document must be of a valid document type and its file
name must match the reference format defined for the selected category.Â

If the category rules state that each document must have an attachment, that
must also be supplied and have the appropriate name and file type. You can
also upload attachments of optional document types.

In Business Rules workspaces, the upload procedure will automatically match
documents and their attachments. If the main document and attachment document
are of different file types, they must have identical file names (for example,
main: REPORT-FIN.pdf, attachment: REPORT-FIN.doc). If the main document type
and attachment document type are the same, however, the categoryâs naming
rules will include a non-mandatory part that will not be included in the
document reference and allows you to identify the attachment documents (for
example, main: REPORT-FIN.pdf, attachment: REPORT-FIN-ATT.pdf).

When you upload attachment documents, a mandatory type of attachment must
always be uploaded with the main document. An optional type of attachment can
be uploaded on its own as long as the main document that it matches already
exists in the workspace.

The Upload Monitor will validate the selected documents and display the result
in the Message field. If any of the documents fail to upload you can remove
them from the upload by clicking on the cross icon.

  1. If all of the selected documents fail validation for the selected category, close the window and begin the process again. 
  2. When the Message column for each of the selected documents contains a tick, press Next. 
  3. The Upload Monitor displays a summary of the documents ready to be uploaded. To add more documents to the upload, press the Add Documents button. Browse your local drive for the documents you wish to upload, then press Open.Â 

Additional documents are automatically added to the same category as the rest
of the documents. If the new documents pass the category validation, press
Next to add them to the upload.

  1. Press Next. 
  2. The Files page determines whether your selected files will be uploaded as new documents in the workspace or revise existing ones and displays this information in the Status column for each document. 

Upload Status  |  Description   
---|---  
New DocumentÂ Â Â  |  No match has been found. This file will be uploaded as a new document.   
New VersionÂ Â Â  |  A match has been found with an existing workspace document. This file will be a new revision of that document.   
New ContentÂ Â Â  |  A match has been found with a placeholder. This file will provide content for that placeholder.   
  
Â

  1. You can view the relationship, if any, of a document selected for upload by hovering over the file icon. 

File type  |  Relationship description   
---|---  
New version of existing document  |  Shows the document reference and file location in the workspace.   
Attachment being uploaded  |  Shows the parent document of the attachment.   
New content for a placeholder  |  Shows the placeholder reference and file location in the workspace.   
New version of a checked out document  |  Shows the document reference and file location in the workspace and informs you that the document will be checked in once the upload is complete.   
  
Â

  1. If a document selected for upload references additional documents (for example, multi-part CAD drawing files) FusionLive will look for these and, if it finds them, automatically add them along with the main file. These files will be displayed as child references to the parent file. 

If a reference file isnât found, the expected file will be displayed as a
missing file. To locate a missing reference, click on the Add document button
and browse to locate it.

Alternatively, to proceed with upload without the missing file, press the
Options button pane... and select Leave Unresolved.

Note  Files selected to resolve a missing file must pass the category
validation rules.

  1. If you associate the wrong child file, revert your action by selecting Remove from the Options menu. 
  2. You can continue to add and remove documents to the Files screen using the Add Documents button. If you add a document to the upload that has the same filename as a missing reference, the document will automatically be added as the missing child document.Â 
  3. You can remove a specific file from the upload by selecting Remove from its Options menu. Alternatively, you can select several files and press Remove Documents at the top of the screen. 

Note  If you choose to remove a document which is a child of a parent
document, the entry in the upload page will be shown as a missing reference
for all of the master files that referenced it. If you remove a parent file
which has children, you will be given the option of removing the child files
too or just the selected parent document. The exception to this scenario is
when the child files are also reference by other parents in the upload screen,
in which case only the selected parent document will be removed.

  1. When you have managed all of the references and associations for the selected documents, press Next. 

On the Metadata screen, each document is given a reference according to the
category numbering rules. Supply any additional metadata for the documents. If
you want the same value to be applied to all metadata fields a column, enter
the value for the first field and then click on the Copy Down button to apply
it to the rest of the column. Alternatively, if a document has attachments,
press the Copy Down to Attachments button to apply the parentâs value to its
attachments.Â  Note  The following characters cannot be used in metadata
fields: \ /:*?<>=^"|'& (& can be used in the Title field).

If you want the same value to be applied to all metadata fields a column,
enter the value for the first field and then click on the Copy Down button to
apply it to the rest of the column. Alternatively, if a document has
attachments, press the Copy Down to Attachments button to apply the parentâs
value to its attachments.

You can remove a file from the Metadata screen by clicking on the fileâs
Remove icon.Â  Note  You may need to scroll to the right to locate this
button.

Note  In a Deliverables Management workspace, the Originator field is
automatically filled with the name of your company. If the Allow Edit by
Multiple Originators feature is enabled, Originator can be changed, allowing
you to upload documents for users in other companies. If this feature is not
enabled, only Document Controllers or Workspace Administrators can do so.

  1. If the reference of a document matches an existing one, the document will be uploaded as a new version of that document. Depending on the setup of your workspace, it may be mandatory to change the revision number when you revise the document. 
  2. If the reference of a document matches that of a placeholder, the uploaded document will become the content of the placeholder. Depending on the relationship between the reference numbering and revision, the following will happen: 

RevisionÂ Â Â  |  Number of versions  |  Outcome   
---|---|---  
Entered text, select from drop-down menu, select from code table  |  1  |  Revision will be inherited from placeholder   
Entered text, select from drop-down menu, select from code tableÂ  |  >1  |  Revision must be entered   
Linked to referenceÂ  |  Any  |  Revision will be inherited from placeholder and appended to file name.   
  
  
Note  The revision of the document will not increase when it is added as
content to the placeholder.

Note  You cannot change the reference and revision metadata to be the same as
an existing document that is not a placeholder.

  1. When all of the documents have the required metadata, press Done. 

If neither Forced Alerting nor Automatic Distribution from Upload are enabled,
you can select an activity to notify other users that the documents have been
uploaded or to begin an activity such as a deliverables submittal.Â

If Forced Alerting is enabled, this is mandatory and the To field is filled
automatically. Complete the message field and select any additional CCâd
users and press Send.

If Automatic Distribution is enabled, when the documents are uploaded they
will be distributed automatically to the recipients set out in the
distribution matrix (see [ Automatic distribution ](Automatic_fi.htm#h) ).

