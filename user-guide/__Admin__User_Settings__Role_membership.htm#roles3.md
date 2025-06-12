Role memberships

Click here to see this page in full context

###  Role memberships

Users and user groups may be assigned to standard roles in FusionLive. The
roles available to your users will depend on the settings enabled.

RoleÂ Â Â  |  Permissions   
---|---  
Document ControllerÂ  |  Manages the documents uploaded to the workspace. Can update document metadata for any workspace document and initiate activities using documents uploaded by any user.   
When Deliverables Management is enabled, you can also edit the metadata of
documents which are locked because they have been sent on submittal, as well
as send documents uploaded by another originator on submittal.  
Group AdministratorÂ  |  Creates and manages custom workspace groups.   
BI Administrator  |  Creates BI reports on workspaces where the user has this role, creates schedules for BI reports to be run and has access to the BI Metadata Settings and BI Numbering Settings administration areas.   
Can also view the Company Users Login report, without being a Company
Administrator, and view dashboards.  
RFI roles  |  RFI Administrators can view all RFIs in the workspace and can action any RFI without being assigned.   
RFI Viewers can view all RFIs in the workspace without being assigned.  Note
Users do not require membership in these roles to action an RFI where they are
assigned.  
TQ roles  |  TQ Administrators can view all TQs in the workspace and can action any TQ without being assigned.   
TQ Viewers can view all TQs in the workspace without being assigned.  Note
Users do not require membership in these roles to action a TQ where they are
assigned.  
Approval roles  |  Approval Administrators can view all approvals in the workspace and can action any approval without being assigned.   
Approval Viewers can view all approvals in the workspace without being
assigned, and also reply to but not action them.  Note  Users do not require
membership in these roles to action an approval where they are assigned.  
Numbering AdministratorÂ  |  You must be a numbering administrator as well as a workspace administrator to define reference numbering schemes for document categories. A numbering administrator can also define the numbering for RFIs and TQs.   
Doc Linking AdministratorÂ  |  Can create document links in the workspace.   
Folder AdministratorÂ  |  Manages folder security.   
Automatic Distribution RolesÂ  |  Automatic Distribution Administrator manages the automatic distribution matrix.   
Automatic Distribution Users can trigger automatic distribution by uploading
documents or changing PM status so that they match the distribution criteria
in the automatic distribution matrix.  Note  Workspace Level Upload must be
enabled.  
Email Out AdministratorÂ  |  Manages accounts of email out recipients external to FusionLive.   
Secure Email Out AdministratorÂ  |  Manages accounts of secure email out recipients external to FusionLive.   
Rendition roles  |  If Rendition Security is not enabled:   
Rendition Administrators manage rendition settings including rendition
templates.  
Rendition Contributors can create and upload renditions.  
Rendition Viewers can view renditions.Â  
If Rendition Security is enabled:  
Native Users can view, mark up and download both native documents and
renditions, and also send them on activities.Â  
Rendition Administrators manage renditions and the rendition template.  
Rendition Contributors can create and upload renditions.  
(All users in the workspace can view renditions.)  
Note  If Rendition Security is enabled, markups can only be added to
renditions.  
Tag Roles  |  Tag Manager can manage tag records in FusionLive. Management tasks include creating, editing and deleting tag records and managing their associations to documents, other tags and purchase orders, as well as importing and exporting tag records (in addition to the permissions of the Tag Viewer, Tag Extractor and Tag Validator roles).   
Tag Validator can validate tags (in addition to the permissions of the Tag
Viewer role).  
Tag Extractor can send documents for tag extraction (in addition to the
permissions of the Tag Viewer role).  
Tag Viewer can view tag information and associated documents in FusionLive but
cannot add or change them. They can also export tags with associations.  
See [ Tag Management Admin ](../../Tag_Management/Tag_Management_Admin.htm)
for instructions on applying Tag Roles.  
Transmittal AdministratorÂ  |  Has visibility of all Transmittals in the workspace and can acknowledge receipt of any transmittal sent to their company.   
Deliverables Activity Administrator  |  Can access and action all Submittals, Formal Reviews and Formal Approvals in the workspace.   
Package roles  |  Package Administrator creates work packages for folders in the workspace that they have permission to view.   
Package Report Administrator runs the Package Report to view information about
changes made to the contents of folders.  
Restricted UsersÂ Â  |  Allowed to access only specified types of attachment to preserve document security.Â   
Note  Not available on Business Rules or Inbox workspaces.  
BIM Users  |  BIM User can open BIM-type files (.IFC) for viewing and editing in the Catenda third party application.Â   
Activity SenderÂ  |  Activity Sender can send a new activity of a specified type. Role membership is determined individually for each activity available in the workspace. If no user or group is assigned then all users can send that activity.Â   
  
Â

Note  These roles are standard system roles. They perform a different function
to the workspace roles created for use in sub-projects (see [ Workspace roles
](../Project_Settings/Pro.htm#h) ).

  1. In the User pane, select a Role. 
  2. Select users or user groups in the Available Companies/Users list and press the Add button to add those users to the role.Â 

Note  If there are sub-permissions within the role such as Administrator or
Viewer, use the Add button appropriate for that permission.Â

  1. To remove users from the role, select them and press the relevant Remove button. 
  2. You can undo your changes at any time by pressing Undo Changes. 
  3. When you have finished configuring the role users, press the Apply button. 

Additionally, other roles are assigned elsewhere in FusionLive.Â

RoleÂ Â Â  |  Permissions   
---|---  
Document OwnerÂ Â Â  |  Can access and update their own documents provided they have access to the folder and current lifecycle status. Can delete documents (if the Owner Delete Document setting is enabled).   
Folder roles  |  Folder Viewer views and downloads documents.   
Folder Administrator. When Folder Management is enabled, only members of this
role can create folders. Additionally, if the Subprojects module is also
enabled, only members of this role can create folders in a subfolder template.  
Document Lifecycle roles  |  Document Lifecycle Administrator can view documents when they have a specific PM status and can change the PM status of a document in that status.   
Document Lifecycle Viewer can only view documents when they have a specific PM
status.  
Inbox Roles  |  Inbox Administrator manages access to the Inbox and can move documents from the Inbox to the Outbox.   
Inbox Contributor can move their own documents from the Inbox to the Outbox.  
Self Administrator  |  Manages all aspects of user, administrator and company access to the workspace, as well as reassignment of permissions between users.   
Manages workspaces and, if also a Company administrator, workspace templates.  
Business Process Management Administrator  |  Manages and deploys business processes in all of your company's workspaces where the Business Process Management feature is enabled. You must be a Company Administrator.   
Note  Business Process Management Administrator permissions cannot be
administered from within FusionLive. If you require these permissions, contact
FusionLive support.  
Issue Management roles  |  Issue Administrator configures the Issue Management module settings and also has administrative control of all issues in the workspace.   
Issue Manager adds relevant metadata to issues and assigns them to Issue
Assignees. Also reassigns or rejects issues when required, and closes
completed issues.  
Issue Assignee performs work on issues assigned to them and then hands them
back for inspection. Can also create new issues if required.  
Issue User records on-site defects by creating issues.  
Super Administrator  |  Enables the management of workspace folders and upload packages and does not require specific access permissions. To be used when no other user can perform these tasks.Â   
This role can only be assigned to your workspace in consultation by request.  
  
Â

