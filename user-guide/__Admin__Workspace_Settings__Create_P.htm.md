Create PM status

Click here to see this page in full context

###  Create PM status

  1. In the Workspace Settings pane, press the Status Configuration button. 
  2. To create a new PM status, press the New Status button. 
  3. Enter a name for the status in the PM Status box. 
  4. Select the type of status from the Type drop-down menu. 

Status Type  |  Description   
---|---  
Change StatusÂ  |  Reflects a change in the status of the document undergoing the activity. For example, Approved, Released.   
Reupload  |  Note  Only available in a workspace with Inbox module enabled.   
Used when a document needs to be uploaded again (for example, following
rejection in an approval lifecycle). The upload behavior is configured by the
New upload control.Â  
Move/ReviseÂ  |  Note  Only available in a workspace with Inbox module enabled.   
Used when a document is moved or revised.  
  
Â Â

  1. If the status type is Reupload, select the upload behavior from the New upload drop-down menu. 

Status Type  |  Description   
---|---  
SameÂ Â Â  |  The uploaded document must be the same as the rejected document.   
New  |  A new version of the rejected document must be uploaded.   
Any  |  The uploaded document can either be the same as the old one or a new version.   
  
Â Â

  1. To make the status active and available for selection, check the Activate Status box. 
  2. When manually changing the lifecycle status of multiple documents, FusionLive can validate that the documents were all uploaded by the same user. To enable this, check the User validation box. 
  3. To enable the documentâs owner to view the document when it has this PM status, regardless of whether the owner is added to the Viewer or Administrator lists, check the Owner view rights box. 
  4. To enable users from the company of the document owner to view documents with this PM status, regardless of whether they are added to the Viewer or Administrator lists, check the Company user viewer rights box. 
  5. To enable all users from the company of the document owner to administer the lifecycle status of documents with this PM status, regardless of whether they are added to the Administrator list, check the Company user admin rights box.Â 
  6. Select the Activity that will be triggered when this status is invoked. Activities can be: 

  * Message 
  * Approval (always visible, but enabled only if the Approval module is enabled) 
  * Automatic Distribution 
  * Business Process (only if the Business Process Management module is enabled) 

  1. If the selected activity is automatic distribution, you can select users who must use automatic distribution to distribute documents in this status. All other users will have automatic distribution as their default distribution option but will be able to select a different option. 

Click on the Forced Users link, select users in the Available Users column and
press Add to add them to the Selected Users column. When your select of users
who will be forced to use automatic distribution for documents in this status
is complete, press Apply.

  1. If the selected activity is business process, select the Business Process activity to be invoked. 
  2. If you want the details of the activity to be sent to other users as a print job when the lifecycle status changes, check the Send Repro box. 
  3. If Send Repro is enabled, choose whether to include the activity details in the print job.Â 

Note  If the activity is message, you can only select message. If the activity
is approval, you must select approval.Â

  1. If you want a rendition to be created when the status changes, check the Enable Rendition box and select a template from the Rendition Template box.  Note  If a document enters this status as a result of closing a formal review. 
  2. To make the status active and available for selection, check the Activate Status box. 
  3. In Deliverables Management workspaces, the Review Ready field indicates how many of the documents in a submittal are ready to be responded to. By default, this happens when the document completes a Formal Review and is given the lifecycle status Reviewed, but this count can also be based on the following statuses: Reviewed, Accepted, Approved and Custom. 

To enable one of these statuses to show that a submittal document is ready for
a response, check the Review Ready box.Â

  1. In Deliverables Management workspaces, to restrict contributors from changing reason for issue when uploading a new version or creating a new placeholder when the document is in this PM status, check the Prevent Change Of Reason For Issue box. 

Note  Document Controllers are not restricted by this setting.

Note  Contributors can still change reason for issue by updating the field
manually on the Document Information page.

  1. In Deliverables Management workspaces, you can enable the percentage complete to be updated when the status is applied to a document in a milestone chain. This is irrespective of the Reason for Issue.Â 

To enable this feature, check the Update Percentage Complete.

  1. Press Apply. 

