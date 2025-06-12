Manually revising documents

Click here to see this page in full context

###  Manually revising documents

Note  Not available in Inbox workspaces or workspaces with business rules.

The FusionLive Upload process includes the ability to automatically match or
select existing documents for which a document selected for upload will become
a new version. However, you can also revise documents manually.

Note  If the Restrict Document Revision to Originating Company feature is
enabled, you can only revise documents that were originated by a different
company if you are a Document Controller or Workspace Administrator.

  1. In the Documents page, navigate the folder structure to locate the documents you want to revise, and select them. 
  2. From the Document Actions menu, select Revise.Â 
  3. If you are only revising one document, go to step 4.Â 

If you are revising multiple documents, the Files page is displayed showing
that each document has the upload status of Pending Revision.

For each document, click on the Options button and select Find in Local File
System.

  1. Locate the document you want to upload and press Open. When the Upload Monitor has validated the document, press Next. The upload status will change to New Version. 
  2. In the Files page, the documents inherit the category and reference from the document being revised. 
  3. If a previous version of a file contained attachments or links but the new version does not, the missing attachments or links will be displayed. Attachments will have the upload status Pending Revision, whereas links will have the status Pending Link Decision.Â 

You have the following options:

Unsupplied attachments action  |  Description   
---|---  
Revise attachment  |  To revise an unsupplied attachment, select Find in Local File System from the Options menu and locate the new version of the attachment document. Note Links cannot be revised.   
Carry forward unsupplied attachments  |  To attach the listed attachments or links to the new main document version for all of the documents being revised, select Carry forward unsupplied attachments at the bottom of the Files screen.Â   
Ignore unsupplied attachments  |  Select Ignore unsupplied attachments to upload the main documents without attachments or links for all of the documents being revised.   
  
Â

  1. When all of the documents have a file selected for upload, press Next. 
  2. In the metadata page, supply or update any relevant metadata. 

Note  The following characters cannot be used in metadata fields: \
/:*?<>=^"|'& (& can be used in the Title field).Â

Note  Depending on the setup of your workspace, you may have to change the
revision number when you revise a document.

Note  In a Deliverables Management workspace, the Originator field is
automatically filled with the name of your company. If the Allow Edit by
Multiple Originators feature is enabled, Originator can be changed, allowing
you to revise a document from one originator with one from another company. If
this feature is not enabled, only Document Controllers or Workspace
Administrators can do so.

  1. Note  In a Deliverables Management workspace where a schedule has been created for the document, the next reason for issue according to the schedule is displayed and the dates associated with it are automatically applied (see [ Deliverables Management Schedule ](Deliverables_Management_Schedu.htm#h) ). However, if the document is in a PM status that prevents change of reason for issue, the Reason For Issue of the current document will be carried forward. 

Document Controllers can select any reason for issue (however, changing to any
but the next reason for issue in the schedule will be to deviate from the
schedule). Contributors can only select the next reason for issue in the
schedule, as long as that action is allowed by the documentâs lifecycle
status.

  1. When you revise documents which are attachments, you can choose whether to make them available to all users or to restrict them from users on the Restricted Users role. For each attachment being revised, select Unrestricted or Restricted in the Attachment Type field. 

If you are on the Restricted Users role for this workspace all attachments you
upload will have unrestricted availability.

  1. Press Done to upload the revised documents. 
  2. If you want to notify users that the documents have been revised, click Yes on the Notify pop-up window. Select the desired option from the activity drop-down menu. Fill in the mandatory and optional fields for the activity, then press Send. 
  3. If Auto Rendition is enabled and the file type of the document is associated with a rendition template, a rendition will be initiated. Once it has completed, the rendition icon will be displayed for the document. 

