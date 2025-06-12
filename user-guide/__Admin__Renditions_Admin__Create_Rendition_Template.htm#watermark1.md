Create Rendition Template

Click here to see this page in full context

###  Create Rendition Template

A rendition template consists of several key parts. These include:

  * Basic Information - the title, description and output file format 
  * Header Information - content of the rendition document header 
  * Footer Information - content of the rendition document footer 
  * Cover Sheet - if a standard cover sheet document is included in the rendition, its document file, size and orientation 
  * Logo - if a company logo is required, its positioning 
  * Watermark - if a watermark is required, its size, style and positioning 
  * Stamping - content and styling for digital signature stamps used on comments 
  * Enable Authentication on Final Comment - forces users closing an approval with a status associated with this template to enter their username and password 

The Stamping area of the of template will contain information about the users
and documents involved in the activity. This information is passed into the
header, footer or body sections of the Stamping area via metadata field tokens
which are replaced by the relevant values when the rendition document is
created. These tokens can also be used in the cover sheet if required.

The tokens available for use depend on whether the activity type is Approval
or Formal Review. When Formal Review is selected an additional drop-down of
Document Metadata tokens is made available.

Metadata fieldÂ  |  Field code token   
---|---  
Formal ReviewsÂ  |  Â   
Assignee First Name  |  ${process.activities.formalReview.assigneesList.firstName}   
Assignee Last Name  |  ${process.activities.formalReview.assigneesList.lastName}   
Assignee Company Name  |  ${process.activities.formalReview.assigneesList.companyName}   
Assignee Email AddressÂ  |  ${process.activities.formalReview.assigneesList.email.address}   
Assignee Job Title  |  ${process.activities.formalReview.assigneeJobTitle}   
Originator First Name  |  ${process.activities.formalReview.creator.firstName}   
Originator Last NameÂ  |  ${process.activities.formalReview.creator.lastName}   
Originator Company Name  |  ${process.activities.formalReview.creator.companyName}   
Originator Email Address  |  ${process.activities.formalReview.creator.email.address}   
Originator Job Title  |  ${process.activities.formalReview.originatorJobTitle}   
Final Decision Code  |  ${process.activities.formalReview.finalDecisionCode}   
Final Comment  |  ${process.activities.formalReview.finalComment}   
Date and Time of Final Decision CodeÂ  |  ${process.activities.formalReview.finalDecisionCodeDateAndTime}   
Review TypeÂ  |  ${process.activities.formalReview.reviewType}   
Activity Number  |  ${process.activities.formalReview.activityNumber}   
Activity Created Date  |  ${process.activities.formalReview.createdDate}   
Activity Closure DateÂ  |  ${process.activities.formalReview.closureDate}   
Activity Due DateÂ  |  ${process.activities.formalReview.dueDate}   
Decision CodeÂ Â  |  ${process.activities.formalReview.commentsList.decisionCode}   
Comment TextÂ  |  ${process.activities.formalReview.commentsList.commentText}   
Comment Date and TimeÂ  |  ${process.activities.formalReview.commentsList.createdDate}   
First Name  |  ${process.activities.formalReview.commentsList.createdByFirstName}   
Last NameÂ  |  ${process.activities.formalReview.commentsList.createdByLastName}   
Company NameÂ  |  ${process.activities.formalReview.commentsList.createdByCompany}   
Email Address  |  ${process.activities.formalReview.commentsList.emailAddress}   
User Full Name  |  ${process.activities.formalReview.commentsList.userFullName}   
Job TitleÂ  |  ${process.activities.formalReview.commentsList.jobTitle}   
Document Metadata  |  Â   
Actual Review Date  |  ${document.metadata.Actual_Review_Date.value}   
Planned Review DateÂ  |  ${document.metadata.Planned_Review_Date.value}   
Client Reference Number  |  ${document.metadata.Client_Reference_Number.value}   
Client Response DateÂ  |  ${document.metadata.Client_Response_Date.value}   
Forecast Issue DateÂ  |  ${document.metadata.Forecast_Issue_Date.value}   
Alternative Reference Number  |  ${document.metadata.Alternative_Reference_Number.value}   
Discipline  |  ${document.metadata.Discipline.value}   
Estimated HoursÂ  |  ${document.metadata.Estimated_Hours.value}   
Document ReferenceÂ  |  ${document.reference}   
Revision  |  ${document.revision}   
Actual Approval Date  |  ${document.metadata.Actual_Approval_Date.value}   
Actual Issue Date  |  ${document.metadata.Actual_Issue_Date.value}   
Actual Return DateÂ  |  ${document.metadata.Actual_Return_Date.value}   
Actual Submission Date  |  ${document.metadata.Actual_Submission_Date.value}   
Planned Submission Date  |  ${document.metadata.Planned_Submission_Date.value}   
PM Status  |  ${document.metadata.PM_Status.value}   
Reason For IssueÂ  |  ${document.metadata.Status.value}   
Due Date  |  ${document.metadata.Due Date.value}   
Revision Date  |  ${document.metadata.Revision_Date.value}   
POÂ  |  ${document.metadata.PO.value}   
Planned Issue Date  |  ${document.metadata.Planned_Issue_Date.value}   
Planned Resubmission Date  |  ${document.metadata.Planned_Resubmission_Date.value}   
Planned Return Date  |  ${document.metadata.Planned_Return_Date.value}   
Weighting  |  ${document.metadata.Weight.value}   
Actual Resubmission Date  |  ${document.metadata.Actual_Resubmission_Date.value}   
Phase  |  ${document.metadata.Phase.value}   
Forecast Submission Date  |  ${document.metadata.Forecast_Submission_Date.value}   
Percentage Complete  |  ${document.metadata.Percentage_Complete.value}   
Contract  |  ${document.metadata.Contract.value}   
Document Type  |  ${document.metadata.Document_Type.value}   
Originator  |  ${document.metadata.Originator.value}   
Forecast Resubmission DateÂ  |  ${document.metadata.Forecast_Resubmission_Date.value}   
Scope Group  |  ${document.metadata.Scope_Group.value}   
Title  |  ${document.name}   
Vendor Reference Number  |  ${document.metadata.Vendor_Reference_Number.value}   
Forecast Client Response DateÂ  |  ${document.metadata.Forecast_Client_Response_Date.value}   
Facility  |  ${document.metadata.Facility.value}   
Area  |  ${document.metadata.Area.value}   
Client RevisionÂ  |  ${document.metadata.Client_Revision.value}   
Approvals  |  Â   
First Name  |  ${process.activities.approval.commentsList.createdByFirstName}   
Last Name  |  ${process.activities.approval.commentsList.createdByLastName}   
Job TitleÂ  |  ${process.activities.approval.commentsList.jobTitle}   
Email Address  |  ${process.activities.approval.commentsList.emailAddress}   
Company NameÂ  |  ${process.activities.approval.commentsList.createdByCompany}   
Comment Date and Time  |  ${process.activities.approval.commentsList.createdDate}   
Document ReferenceÂ  |  ${document.reference}   
Approval StatusÂ  |  ${process.activities.approval.commentsList.status}   
Comment TextÂ  |  ${process.activities.approval.commentsList.commentText}   
User Name  |  ${process.activities.approval.commentsList.userName}   
User Full NameÂ  |  ${process.activities.approval.commentsList.userFullName}   
Assignee First Name  |  ${process.activities.approval.assigneesList.firstName}   
Assignee Last Name  |  ${process.activities.approval.assigneesList.lastName}   
Assignee Company Name  |  ${process.activities.approval.assigneesList.companyName}   
Originator First Name  |  ${process.activities.approval.creator.firstName}   
Originator Last Name  |  ${process.activities.approval.creator.lastName}   
Originator Company NameÂ  |  ${process.activities.approval.creator.companyName}   
Activity StatusÂ  |  ${process.activities.approval.status}   
Activity Due Date  |  ${process.activities.approval.dueDate}   
Activity Created DateÂ  |  ${process.activities.approval.createdDate}   
Document ReferenceÂ  |  ${document.reference}   
PM Status  |  ${document.metadata.PM_Status.value}   
Final Comment  |  ${process.activities.approval.finalComment}   
Final Status  |  ${process.activities.approval.finalStatus}   
Date and Time of Final CommentÂ  |  ${process.activities.approval.finalCommentDateTime}   
Final Comment Made By  |  ${process.activities.approval.finalCommentMadeBy}   
Final Commenter Company NameÂ  |  ${process.activities.approval.finalCommenterCompanyName}   
Assignee Email Address  |  ${process.activities.approval.assigneeEmailAddress}   
Assignee Job Title  |  ${process.activities.approval.assigneeJobTitle}   
Originator Email Address  |  ${process.activities.approval.originatorEmailAddress}   
Originator Job TitleÂ  |  ${process.activities.approval.originatorJobTitle}   
Final Commenter Email Address  |  ${process.activities.approval.finalCommentorEmailAddress}   
Final Commenter Job Title  |  ${process.activities.approval.finalCommentorJobTitle}   
  
Â Â

  1. In the Rendition pane, click on Manage Rendition Template.Â 
  2. Press the Create button. 
  3. In the  Basic Information section, enter the Template Name and Template Description. 
  4. The type of activity you select will determine the field codes that you can include in the rendition template. Select from the Activity Type drop-down menu.  Note  Only activities enabled in your workspace can be selected. If only one of these activities is enabled, the rendition template will automatically be configured for that activity. 

Activity Type  |  Description   
---|---  
Approval  |  Provides field codes specific to the Approval activity and should be associated with approval status outcomes.   
Formal ReviewÂ  |  Provides field codes specific to the Deliverables Management Formal Review activity and should be associated with decision code outcome   
  
Â

  1. Select the file format for the rendition document from the Rendition Output drop-down menu. In many cases PDF is the most appropriate format, however you can also select from a variety of image formats. 

Note  If Formal Review is selected for the Activity Type, the Rendition Output
must be PDF.

Note  JPEG and PNG formats are not multi-page image formats. If you choose
these as the rendition output and attempt to render documents with multiple
pages, the rendition will not be processed.

  1. In the  Header Information and  Footer Information sections, enter the text that you want to appear at the top and bottom of each page and define how it should be presented. 

![](../../images/create rendition header footer.png)

SettingÂ Â Â  |  Description   
---|---  
Font  |  Select the font for the text that will appear in the header or footer.   
Font SizeÂ Â  |  Enter the point size for the text. Alternatively, click the top or bottom of the button to raise or lower the size by one point.   
Font ColorÂ  |  Select the color of the text by clicking on the color picker. If you know the exact color that you want, you can enter its HTML code directly. You can return to the default text color by pressing the Revert to Default button.   
Page  |  Select which pages the header or footer will be applied to. The options are: All, First or Last.   
Left TextÂ  |  Type the text that will appear at the left side of the header or footer.   
Right TextÂ  |  Type the text that will appear at the right side of the header or footer.   
Center Text  |  Type the text that will appear in the center of the header or footer.   
Date AlignmentÂ  |  Select where the date should be placed in the header or footer. If left blank, the date will be omitted.   
Page No. AlignmentÂ  |  Select where the page numbers should be placed in the header or footer. If left blank, page numbers will be omitted.   
Left MarginÂ  |  Enter the width of the header or footerâs left margin in inches. Alternatively, click the top or bottom of the button to raise or lower the margin size by one inch.   
Right Margin  |  Enter the width of the header or footerâs right margin in inches. Alternatively, click the top or bottom of the button to raise or lower the margin size by one inch.   
Opacity  |  Enter the opacity of the header or footer. Alternatively, click the top or bottom of the button to raise or lower the opacity by 25%.   
  
Â Â

  1. A  cover sheet allows you to provide recipients of a rendition with standard instructions and information. It must be an Excel spreadsheet with the .xls extension and may contain metadata field tokens relating to the activity which will be converted to values when the rendition is performed. 

![](../../images/coversheet example.png)

If you want to use a cover sheet, press Browse and locate the document on your
local system.  Note  Only one cover sheet can be uploaded at a time.Â

![](../../images/create rendition coversheet.png)

To download an existing cover sheet, press the Download Cover Sheet button.

Select the Paper Orientation and Paper Size for the cover sheet.

To include the cover sheet in the rendition document, select the Enable Cover
Sheet checkbox. To remove it from the rendition, uncheck the box again.

  1. You can insert a company  logo into the rendition document. Press Insert Image and locate the image file in your local drive. 

![](../../images/create rendition logo.png)

Select which Page the image should be applied to: All, First or Last, and then
choose its page Alignment. Make sure that the logo position does not interfere
with the header or footer text on the top or bottom lines of the page (for
example, donât select top right for the logo if the page number is on the
right in the header).Â

To include the Logo in the rendition document, select the Enable Logo
checkbox. To remove it from the rendition, uncheck the box again.

  1. To include a  watermark, enter the text that you want to appear and define how it should be presented. 

SettingÂ Â Â  |  Description   
---|---  
Text  |  The text content of the watermark. If left blank, no watermark will be applied.   
Font  |  Select the typeface for the watermark.   
Font SizeÂ  |  Enter the point size for the watermark. Alternatively, click the top or bottom of the button to raise or lower the size by one point.   
Page  |  Select which pages the watermark will be applied to. The options are: All, First or Last.   
Opacity  |  Enter the opacity of the watermark. Alternatively, click the top or bottom of the button to raise or lower the opacity by 25%.   
Orientation  |  Select the direction in which the watermark will be placed across the page.   
  
Â

  1. The  Stamping feature allows you to complete the rendition document with information regarding the comments that were made during the activity. This information acts as a digital signature of each commenter, validating (for example) the approval of the document, and is overlaid on the document content at a selected position. 

Digital signature stamps are constructed from a selection of metadata field
codes which are populated with the relevant commenter information when the
rendition is created. The metadata field code tokens available to you depend
on which activity that the rendition template is for.Â

The signature section of the rendition is divided into three areas.

Signature areaÂ  |  Description   
---|---  
Header  |  Contains the activity-related information which will be captured via the various code tokens available in the Stamp Attribute selection drop-down menus.   
Body  |  Contains the comment-related information which will be displayed for the published comments which were made about the activity. The body section will be repeated in the Rendition document as many times as there are published comments.Â   
Footer  |  Contains the activity-related information which will be captured via the various tokens available in the Stamp Attribute selection drop-down menus.   
  
Â Â  
You can configure the content and style for the header, body and footer of the
comment entries. For each section, from the Stamp Attribute Selection drop-
down menus, choose the metadata fields required for that part of the comment.
Field code tokens are inserted into the template.

![](../../images/rendition stamp templates.png)

You can configure how a stamp is presented using the FusionLive text editor
(see [ Text editor options ](../../Overview/Text_editor_options.htm#h) ) to
present the information for each commenter clearly.

Note  A maximum of twelve lines will be displayed in the rendition stamp. Any
additional lines will not be displayed. Be aware that if you introduce line
breaks or include comment text in the stamp layout below, the number of lines
will increase, therefore reducing the number of comments that can be included
in the stamp.

  1. Choose the stamp page location so that it is easily found in the rendition document and does not obscure any important text. To determine where in the rendition document the stamp is placed, select from the Stamp On Page menu. 

Stamp location  |  Description   
---|---  
First  |  Places the stamp on the first page of the rendition document.   
Last  |  Places the stamp on the last page of the rendition document.   
Search  |  Enter a word or string in the search box. If the search term is found in the rendition document the stamp will be inserted above it. For example, this can be useful if the rendition document contains a piece of text to identify where the stamp should go.   
Add new pageÂ  |  Appends a blank page to the end of the rendition document and places the stamp on it.   
  
Â Â Â

  1. To determine the position of the stamp on the nominated page, select from the Stamp Alignment drop-down menu. 
  2. To require the user to enter their FusionLive username and password before the approval or formal review which is associated with this rendition template can be closed and the rendition created, check the  Enable Authentication on Final Comment box. 

Note  Comment authentication cannot be used in organizations that use single
sign-on login.

  1. Press Apply. 

