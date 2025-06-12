BIM Documents

Click here to see this page in full context

##  BIM Documents

The FusionLive BIM module enables you to view 3D Building Information Modeling
(.IFC) files. These files can be viewed using the FusionLive 3D viewer or
viewed and editing using an external 3D modeling application (Catenda Hub).

Note  In order to use the FusionLive 3D viewer you may need to whitelist the
Catenda API URL: https://api.catenda/com.Â

###  Create BIM Users

When the BIM module is enabled, users and user groups can be given the BIM
User role (see âRole membershipsâ on page 336). Members of this role
automatically have an account created in your external 3D modeling application
with the same login credentials as their FusionLive account.

  1. In the User pane of the Administration page, click on BIM Roles. 
  2. In the left hand pane, select the users or user groups you want to add and press the Add button to transfer them to the BIM Users pane. 
  3. If you want to remove users from the right hand pane, select them and press Remove. 
  4. Press Apply. 
  5. If the selected users do not already have an account in the external BIM application one will automatically be created for them. If there is a problem synchronizing the user accounts for a user or a member of a user group, press Apply again. 

Note  If you add a user to group that is already a member of the BIM Users
role you will have to manually add that user to the role. Alternatively, add
the group to the role again.

  1. If the current workspace does not already have a corresponding BIM project in the external application, one will be created. Documents will automatically be synchronized between FusionLive and the corresponding project in the external BIM application. 

When a user with the BIM User role opens an .IFC file using the external 3D
viewer, the external BIM application will automatically open and they can log
in to their account using their FusionLive credentials.Â

Note  If a user account is locked, deactivated or removed from the workspace,
the access to the BIM application will also be restricted. If the account is
unlocked or reactivated, it will be reinstated again.

