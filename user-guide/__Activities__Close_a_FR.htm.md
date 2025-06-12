Close a FR

Click here to see this page in full context

###  Close a formal review

When you receive a document for formal review as lead reviewer, you will
review the document, select which comments and markups from other users to
publish and supply a decision code and final comment before closing the
review. You can close a review for one document or for multiple documents with
the same review number.

When you close a formal review you can optionally create a review summary
document. This contains the reviewed document rendered to PDF format, and may
also include a coversheet and the markups, changemarks and electronic comments
selected for publication. Attachments provided with electronic comments can
also be included.

If a consolidator has been assigned, you will be notified when the
consolidator has consolidated the review markups, indicating that the review
is complete and ready to be closed.

  1. In the Assigned To Me folder, locate the formal reviews you want to close. 
  2. If a consolidator has been assigned, check whether the consolidation task has been completed. You may want to delay closing the review until that has happened. 
  3. Open the documents and review their contents.Â 
  4. If markups have been added to a document, select it and press View. Use the Viewer tools to review the markups that have been created by other members of the review. If a consolidator is assigned to the review they may have created a consolidation layer comprising selected markups. You can also create a consolidated markup layer containing elements of other markups if you want (see [ Consolidate markups ](../Documents/Consolidate_markups_\(new_viewer\).htm#h) ). 

From the Viewerâs Review menu, select Close Review and then close the Viewer
window.

  1. In the Review page, select one or more documents and press the Close Formal Review button. 

The review type is displayed at the top. If a closing PM status is associated
with the review type, it will also be displayed here. This status will be
applied to the documents when the review is closed.Â

  1. Perform the following steps for each document in the review. 
  2. Select a Final Decision Code. The decision codes available to you will depend on your workspace and the review type. 
  3. The electronic comments made by the review commenters are listed. You can choose which will be made available, after the review is closed, to the review initiator, the sender of the submittal or participants in a subsequent formal approval. By default all comments are selected for publication. To select or deselect individual comments, check or uncheck the relevant boxes. 

If you are going to create a review summary, you can also select which
electronic comment attachments you want to include in that document. Published
comment attachments will either be rendered into the review summary PDF as
additional pages or as embedded content, depending on the action defined on
the formal review rendition template.

Note  The Type column indicates attachments that are uncontrolled. Since these
are temporary documents used only to support a comment, it is especially
important to review these for inclusion in the review summary.

If you publish to PDF without creating a review summary, you cannot include
comments or their attachments.

  1. The markups made by the review commenters are listed. You can choose which will be made available, after the review is closed, to everyone who has permission to view the document. By default all markups are selected for publication. To select or deselect individual markups, check or uncheck the relevant boxes. 
  2. To Publish comments to PDF, check the box. This will publish the document with markups and changemarks to a PDF (depending on the options described below). 

If Renditions are enabled in the workspace, select a rendition template to use
for the summary of the formal review.

Note  The composition of a review summary (for example, if it includes a
coversheet and the electronic comments) is determined by a rendition template
(see [ Formal Review Rendition Template
](../Admin/Renditions_Admin/Formal_Review_Rend.htm#h) ). Any attachments
provided with electronic comments and selected for publication are appended to
end of the rendition. Similarly, any xrefs associated with the document are
appended to the end of the rendition.

If the final decision code you selected is associated with a rendition
template, this will be displayed in the Template field and you must use this
to create the review summary document.

If the final decision code you selected is not associated with a rendition
template, you can select any template from the drop-down menu.

Alternatively, if you want to publish the markups and changemarks to a PDF
document without applying a rendition template, select No Summary.

Note  A review summary document is a system generated document. You can view
which documents are system generated and which are uploaded by users by adding
the Document Origin column to the Documents grid.

  1. Select how you want the markups to be included in the rendered PDF. 

Markup inclusion  |  Description   
---|---  
Burn-in current markupsÂ  |  The markups will be burned onto the rendered review document pages. They cannot be moved or deleted in the published document. Note In the new viewer, any embedded attachments or notes will be lost when burn-in is selected.   
Markup as comments  |  The markups will be included as PDF comments. When the published document is opened with Adobe Acrobat, these comments can be moved or deleted. It is also possible to reply to the comments. Once saved within Adobe Acrobat, these edits and replies can be uploaded as a new version to make those changes available to other FusionLive users.   
  
Â

  1. Check the Append changemark notes box to include any changemarks in the rendered PDF. 

In the old viewer, if the markups contain changemarks, these can be appended
as a summary page on the published PDF. In the new viewer, all comments,
replies, attachments, labels and links will be appended in a list to the PDF.

  1. Alternatively, you can export changemarks or text markups to an Excel spreadsheet which will be added as an attachment to the review document. To do this, check the Publish Comments to Excel box.Â 

Note  This does not include electronic comments.

Note  In the old viewer, only changemarks or text markups can be exported to
Excel.

  1. Enter a Final Comment if required. 
  2. The Attachments area allows you to attach additional supporting documents to the final comment. Depending on the modules enabled for your workspace, these may be sourced either from the workspace folder structure or from your local system. Attachments sourced from workspace files are known as controlled documents and will be available to be viewed by other users in the workspace. You can also create new controlled attachments by uploading them now. However, if the documents are temporary and are not required to be added to the workspace they can be attached as uncontrolled documents instead. 

Attachment type  |  Description   
---|---  
Attach a document from the workspace  |  Allows you to attach a controlled document that already exists in the workspace to your comment.   
Press Add and choose the relevant document from the workspace folder
structure.  
Upload and attach  |  Allows you to upload a document that is not currently in the workspace (for example, a comment sheet) This will become a controlled document in the workspace and attached to the final comment.   
Press Upload and Attach, select the relevant document and press the Open
button. Complete the Upload process.  
Upload an uncontrolled documentÂ  |  If the Allow Uncontrolled Attachments module is enabled, this allows you to attach an uncontrolled document from your local system to your comment. This document will not be added to the workspace.   
Press the Add Uncontrolled File button, select the relevant document and press
the Open button.  
Uncontrolled attachments are indicated in the Type column.  
  
  
Note  Not available with the new viewer if No Summary is selected.

  1. To remove an attached document from the final comment, select it and press the Delete button. 
  2. To include final comment attachments in the review summary, make sure the relevant Publish box is checked. To omit final comment attachments from being published, uncheck the Publish box. Published comment attachments will either be rendered into the review summary PDF as additional pages or as embedded content, depending on the action defined on the formal review rendition template. 
  3. Press Close Formal Review. If Final Comment authentication is enabled for the selected review summary template, enter your FusionLive username and password to authenticate your comment. 

The documentâs lifecycle status changes to Reviewed.

  1. If you checked the Publish comments to PDF box and selected the review template linked to the final decision code, the review summary will either be published as a version of the reviewed document or an attachment to it, as determined in the review template association settings.Â 

If you chose a template that hasnât been associated with a decision code or
No Summary, a pop-up window will ask you to select how the review summary
document or rendered PDF file should be uploaded.

Publish option  |  Description   
---|---  
Revise reviewed document  |  The published review summary document will become a new revision of the reviewed document. The decision code and lifecycle status will be carried forward.   
The revised document will be shown in the formal review. If the formal review
was initiated from a submittal, the revised version will be shown, with the
previous version grayed out.  
Add as an attachmentÂ  |  The published review summary document will be added as an attachment to the reviewed document.   
  
  

Note  If Rendition Security is enabled, the review summary will be a PDF
rendition of the reviewed document instead. If you selected Revise, it will
become a new version of the native document. If you selected Attach the review
summary document and its rendition will be attached to the native document.

Note  If for any reason the rendering of the published PDF fails you will be
notified. The Reviewed status of the original document will not be affected,
but you will have to upload the PDF manually. Firstly, in Viewer select the
required markups and publish them to PDF (see [ Publish marked-up documents
](../Documents/Publish_marked-up_documents.htm#h) ), then locate the reviewed
document and either revise the original document manually (see [ Manually
revising documents ](../Documents/New_Topic2.htm#h) ) or attach it to the
reviewed document (see [ Attachments ](../Documents/Attachments.htm#h) ).

  1. If you checked the Publish Comments to Excel box, the spreadsheet document will be uploaded as an attachment to the reviewed document. 
  2. Follow the upload process for any attachments created during the closure of the review 

Â

