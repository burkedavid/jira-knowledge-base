Uploading documents

Click here to see this page in full context

###  Uploading documents

Each uploaded document is associated with a document category.Â

Note  The maximum file size for documents to upload is 9GB.

Documents new to your workspace are uploaded as New Documents. However, during
the upload process, FusionLive will try and determine if a previous version
exists in the workspace. Unless the No Match setting is enabled, it does this
by looking for a match. For CAD files, it looks for a matching object ID which
is automatically added to the file when it is downloaded. For other file
types, it looks for a match between the reference and the selected
documentâs filename. This matching depends on the revision matching rules
for your workspace, which may be an exact match, a match with the beginning of
the filename or a match anywhere in the filename. If FusionLive finds a match,
the document being uploaded will be considered a New Version and will
automatically be given the reference and category of the existing document. If
you download a document and then change its filename, when you upload the new
revision you can manually match the revision to its document.

Note  These instructions assume that document reference matching is enabled.
If No Match is enabled and CAD reference checking is not enabled, you can
search for documents to revise manually.

Note  These instructions apply to workspaces that do not have the business
rules module enabled. For uploading documents to a Business Rules workspace,
see [ Upload with Business Rules ](Upload_with_Business_Rules.htm) .

  1. On the Documents page, select a folder and press the Upload button on the menu bar.Â 
  2. Select documents and press Open. The Upload monitor will validate the selected documents and display the result in the Status field. If any of the documents fail the validation, you can select them individually and click Retry. If several fail to upload, click Retry All.Â 

If a document persistently fails validation, select it and press Remove
Document before trying the upload again.

  1. To add more documents to the upload, press the Add Documents button. Select documents and press Open. 
  2. To remove a document from the upload list, select it and press the Remove Documents button. 
  3. When the upload monitor validation is complete, press Next. 
  4. The Files page uses your workspaceâs version matching logic to determine whether the selected files will be uploaded as new documents in the workspace or revise existing ones. It displays this information in the Status column for each document. 

Upload Status  |  Description   
---|---  
New DocumentÂ Â Â  |  No match has been found. This file will be uploaded as a new document.   
New VersionÂ Â Â  |  A match has been found with an existing workspace document. This file will be a new revision of that document.   
New ContentÂ Â Â  |  A match has been found with a placeholder. This file will provide content for that placeholder.   
  
Â

  1. If the Enable CAD reference check setting is enabled and an AutoCAD drawing is selected for upload which contains xrefs, they will be displayed as child references to the parent file. 

If a reference file is not found, the expected file will be displayed as a
missing file. To locate a missing reference, click on the Options menu â¦ and
select one of the following:

Missing File action  |  Description   
---|---  
Find in WorkspaceÂ Â Â  |  Browse the workspace folders to locate the missing child file.   
Find in Local File System  |  Browse your local system to locate the missing child file.   
Leave Unresolved  |  The file will remain missing and the upload can proceed without it.   
  
  
If you associate the wrong child file, you can revert your action by selecting
Remove from the Options menu.

  1. You can view the relationship, if any, of a document selected for upload by hovering over the file icon. 

File type  |  Relationship description   
---|---  
New version of existing document  |  Shows the document reference and file location in the workspace.   
Attachment being uploaded  |  Shows the parent document of the attachment.   
New content for a placeholder  |  Shows the placeholder reference and file location in the workspace.   
New version of a checked out document  |  Shows the document reference and file location in the workspace and informs you that the document will be checked in once the upload is complete.   
  
Â

  1. If the matching logic discovers one matching reference for the file you are uploading, the file will automatically be identified as a new version of that document. However, an information icon will indicate if multiple matching references are found.Â 

Click on the icon to display the matching documents in the Suggested Matches
window. Select the one that you want to revise and press Select.

If none of the suggested matches are suitable you can click on the Within
Workspace tab and locate a document to revise manually.

  1. If a previous version of a file contained attachments or links but the new version does not, the missing attachments or links will be displayed. Attachments will have the upload status Pending Revision, whereas links will have the status Pending Link Decision.Â 

You have the following options:

Unsupplied attachments actionÂ  |  Description   
---|---  
Revise attachment  |  To revise an unsupplied attachment, select Find in Local File System from the Options menu and locate the new version of the attachment document.  Note  Links cannot be revised.   
Carry forward unsuppliedÂ attachments  |  To attach the listed attachments or links to the new main document version for all of the documents being revised, select Carry forward unsupplied attachments at the bottom of the Files screen.   
Ignore unsupplied attachments  |  Select Ignore unsupplied attachments to upload the main documents without attachments or links for all of the documents being revised.Â   
  
Â Â

  1. If the automatic matching is incorrect, you can change the upload option. Select a document, click on the Options menu â¦ and select the required action. 

Upload option  |  Description   
---|---  
Update Existing  |  If the document you are uploading is a new version of an existing document or content for a placeholder but hasnât been matched, select this option and locate the document (or placeholder) that you want to update. The documentâs upload status will be New Version if it is updating a document and New Content if it is updating a placeholder, and it will be given the category and reference of the existing workspace document.Â   
Note  If the Restrict Document Revision to Originating Company feature is
enabled you can only revise documents that were originated by a different
company if you are a Document Controller or Workspace Administrator.  
Upload as New  |  If the status is New Version or New Content but you donât want to upload it as a new version or as placeholder content, you can choose instead to upload the document as a new document. The documentâs upload status will be New Document and you will need to supply the category and reference.   
Merge to CAD  |  The default behavior for files with references is for the child files to be stored independently from the parent file. Therefore, a child file will have a different reference from its parent.   
However, if the child reference is a raster image or PDF, you can merge it
with the parent document. From the Options menu â¦ select Merge to CAD. The
upload status will change to Merged and the file will be given a Merged label.  
If you decide to separate parent and child again, select Unmerge from the
Options menu.  
Merge All Rasters  |  If a parent file has child references which are raster images or PDFs, you can merge all of them with the parent in one operation. From the Options menu, select Merge All Rasters. The upload status of the child references will change to Merged and the files will be given a Merged label.   
To separate parent and child again, select Unmerge from each child fileâs
Options menu.  
Attach  |  If the selected document is intended to be an attachment to another document, select Attach from the Options menu.Â   
The tabs allow you to choose a target document from among the other documents
in the Current Upload or from Within Workspace. Use these methods to select
the document you want to attach it to and press Attach. The file is given an
Attached label.  
To reverse this action, select Detach from the Options menu.  
Alternatively, you can attach multiple documents to one document at once.
Select them in the Files screen, press the Attach button and select the
document you want to attach the selected files to, then press Attach.  
Add attachment  |  If you want to add attachments to a document in the Files page, select it, select Add attachments from the Options menu and choose the attachment documents.   
The Attached files are given an Attached label.  
Note  You cannot add an attachment to a document which is itself an attachment
to another document.  
Leave Unresolved  |  When you have located a missing file, you can choose to upload it instead as an associated document. From the Options menu of a missing file that has been located, select Leave Unresolved. The document will be added to the upload as a new document and the reference to the former parent document will be shown as a missing file.   
  
Â

  1. You can continue to add documents to the Files screen using the Add Documents button. If you add a document to the upload that has the same filename as a missing reference the document will automatically be added as the missing child document.Â 
  2. You can remove a specific file from the upload by selecting Remove from its Options menu. Alternatively, you can select several files and press Remove Documents at the top of the screen. 

Note  If you choose to remove a document which is a child of a parent
document, the entry in the upload page will be shown as a missing reference
for all of the master files that referenced it. If you remove a parent file
which has children, you will be given the option of removing the child files
too or just the selected parent document. If the child files are also
referenced by other parents in the upload screen, then the selected parent
document will be removed.

  1. For each new document in the Files page, select the relevant document Category. In documents identified as New Version or New Content, the category field is automatically completed to reflect the document being updated.Â 
  2. Once the category is chosen, its attachment behavior will be applied (see [ Attachment behaviour ](../Admin/Workspace_Settings/Attachment_behaviour.htm) ). If the selected attachment behavior is All attachments inherit their reference number from their parent and the filenames of two files match (according to the matching logic applied to the workspace), one of which is a designated Attachment Type, then that file will automatically be made an attachment to the other matching file. The attachmentâs reference will be the same as the parent, but with a sequential numbered suffix. 

If Match to filename with secondary reference is enabled, and the filenames of
the documents being uploaded instead match the Client Reference or Alternative
Reference of a parent and its attachments, the designated Attachment Type is
used to identify the attachments in the same way. If no Attachment Type is
set, however, the matching logic examines the file extension of the documents
and identifies a match that way.

If you want to change the automatic attachment association, you have the
following options: Â Â

Option  |  Description   
---|---  
Detach  |  Select the attachment file and choose Detach from the Options menu to separate both files.   
Switch To ParentÂ  |  Select the attachment file and choose Switch To Parent to switch the attachment and parent around.   
Switch To Attachment  |  Select the parent file and choose Switch To Attachment to switch the attachment and parent around.  Note  Only available when there is only one attachment.   
  
Â

Note  If a designated Attachment Type document is uploaded without a matching
parent document, it will be treated as a normal parent document.

  1. For each new document, enter the Reference. If a reference numbering scheme has been configured for the category, click on the Enter Reference link, enter the metadata associated with the numbering parts and press Apply. 

Note  If a constraint pick list has been set up between reference number
parts, your selection of one part may limit the options available in a
subsequent part of the reference number.

If the numbering contains a counter part, this will take the next available
number according to the numbering scheme rules. During the life of a project,
sometimes counter numbers donât get used. To use up counter numbers that
have been missed, click on the Available Counters icon and select a number.

If no reference numbering scheme exists for the selected category, enter a
reference number as free text.  Note  The following characters cannot be used:
\ /:*?<>=^"|'&. u

  1. If multiple parent documents reference the same child document, that child document will be listed in the hierarchy for each parent document. However, you can make category and reference selections for only one instance of that document. The others, identified by Duplicate icons, will automatically be given the same category and reference selections. 
  2. When each document and attachment has a reference and category, press Next. FusionLive will validate that the new documents may be uploaded and that any existing documents can be revised.Â 

If a workspace document is locked or checked out by another user, it cannot be
revised and you will have to either remove it from the upload or ask the other
user to release it before proceeding.

If a workspace document is in a category you donât have permission to
access, you will have to remove the document from the upload and ask your
workspace administrator for access to that category.

  1. In the Metadata screen, if you didnât select a folder to upload the documents to, or want to change the destination folder, click on the folder icon and select the folder from the workspace file plan. 
  2. If the Block Revision setting is enabled, and the document is a new version of an existing document, it is mandatory to change the revision number when you revise the document. 
  3. Enter the remaining metadata for each document. 

Note  The following characters cannot be used in metadata fields: \
/:*?<>=^"|'& (& can be used in the Title field).Â

If you want the same value to be applied to all metadata fields in a column,
enter the value for the first field and then click on the Copy Down button to
apply it to the rest of the column. Alternatively, if a document has
attachments, press the Copy Down to Attachments button to apply the parentâs
value to its attachments.

Note If the category has a reference numbering scheme that incorporates the
documentâs metadata, the values determined by the reference number chosen
earlier in the upload process will be automatically filled in the metadata
screen. You can edit these if required.Â

Note In a Deliverables Management workspace, selecting a document type
determines the milestone chain to apply to the document and the values
available in the Reason For Issue field will be filtered accordingly.

Note In a Deliverables Management workspace, the Originator field is
automatically filled with the name of your company. If the Allow Edit by
Multiple Originators feature is enabled, Originator can be changed, allowing
you to upload documents for users in other companies. If this feature is not
enabled, only Document Controllers or Workspace Administrators can do so.

Note In a Deliverables Management workspace where a schedule has been created
for the document, the current reason for issue according to the schedule is
displayed and the dates associated with it are automatically applied (see [
Deliverables Management Schedule ](Deliverables_Management_Schedu.htm) ).
Document Controllers can select any reason for issue (however, changing to any
but the next reason for issue in the schedule will be to deviate from the
schedule). Contributors can only change the reason for issue to the next in
the schedule, as long as that action is allowed by the documentâs lifecycle
status.Â

  1. FusionLive allows you to share documents with restricted users while controlling the types of attachments they are allowed to see. This is done by excluding users and groups who have the Restricted Users role from seeing certain types of file when those file types are used as attachments. However, when you upload documents as attachments, regardless of their file type, you can choose on a per-document basis whether to make them available only to all users or only to unrestricted users. 

For each document being uploaded as an attachment, select Restricted or
Unrestricted in the Attachment Type field.

If you are on the Restricted Users role for this workspace all attachments you
upload will have unrestricted availability.

  1. You can remove a file from the Metadata screen by selecting the document and pressing the fileâs Remove button.  Note  You may need to scroll to the right to locate this button. 
  2. When all of the documents have the required metadata, press Done. 
  3. If you want to incorporate an activity while uploading (for example, to notify users that the documents have been uploaded or to distribute the documents on a deliverables submittal) click Yes on the Notify pop-up window. Select the desired option from the activity drop-down menu. 

Fill in the mandatory and optional fields for the activity, then press Send.

  1. The document is uploaded immediately into the selected folder. If Auto Rendition is enabled and the file type of the document is associated with a rendition template, a rendition will be initiated. Once it has completed, the rendition icon will be displayed for the document. 

If the document is an AutoCAD drawing which has child xrefs, the xrefs will be
both rendered into the same PDF as the parent and rendered individually.

