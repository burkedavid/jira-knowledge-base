Create a FR chain

Click here to see this page in full context

###  Create a formal review chain

If your documents need to go through more than one type of review, you can
create a formal review chain which automatically initiates the next formal
review in the chain on the closure of the first. This is achieved by creating
custom lifecycle statuses, associating them with the creation and closure of
unique review types, and triggering the creation of each new review in the
chain via an entry in the automatic distribution matrix.

For example, if your documents need to under go an internal review followed by
an external review, by creating a review chain where the documentâs
lifecycle status is updated at the creation and closure of each review, the
following might happen.

Review action  |  Description   
---|---  
Internal review created  |  Review type: Internal Review   
PM status: Under_Internal_Review  
Internal review closed  |  PM status: Internally_Reviewed   
Distribution matrix uses this PM status to automatically begin the next review
in the chain.  
External review created  |  Review type: External Review   
PM status: Under_External_Review  
External review closedÂ  |  PM status: Reviewed   
  
Â Â Â  
To create a review chain in this way, the elements must be configured by a
Workspace Administrator.

  1. In the Admin page, open the Workspace Settings pane and select Status Configuration. Create the custom statuses required for the creation and closure of each stage in the review chain.Â 

PM status tab settings  |  Description   
---|---  
Properties  |  Type: Change Status   
Select activity: Automatic Distribution  
Activate Status: enabled  
Lifecycle  |  Select the status that will follow in the chain. For example, Under_Internal_Review may be followed by Internally_Reviewed. Also, include statuses that the document can be moved to manually (for example, Accepted, Rejected, Reviewed).   
Administrators  
Viewer  |  Include the users or groups who will be allowed manually move documents with the selected lifecycle status into a new status.   
Viewers  |  Include the users or groups who will be allowed to view the documents at this stage of the review.   
Recipients  |  Include the users or groups who will be allowed to receive the documents at this stage of the review.   
  
Â

(See [ Status Configuration
](../Admin/Workspace_Settings/Status_configuration.htm#h) for more details).

  1. In the Admin page, open the Workspace Settings pane and select Deliverables. In the Review Types tab, create a review type (for example, Internal Review and External Review) for each review in the chain.   
Â

Key review type settingsÂ  |  Description   
---|---  
Decision CodeÂ  |  Select the decision codes that can be applied on closing a review of this type.   
Creation PM StatusÂ Â  |  Select the custom PM status applied to the document when a review of this type is started (for example, Under_Internal_Review or Under_External _Review).Â   
Closing PM Status  |  Select the PM status applied to the document when a review of this type is closed. This can be a custom status (for example, Internally_Reviewed) or a system status. The last review in the chain should close with the system status: Reviewed.   
Enabled  |  Enabled.   
  
  
Note  When selecting creation and closing PM status for each review type you
have the option of choosing No Status Change if you want the status to stay
the same. However, this option is less useful when creating a review chain
where change of status enables the distribution matrix to trigger subsequent
reviews, and also allows you to view where the document is in the chain.Â

See [ Review Types ](../Admin/Workspace_Settings/New_Topic1.htm#h) for more
details.

  1. Alternatively, you can determine closing status via the decision code selected when a review is closed.Â 

Note  Closing PM status is also applied by a decision code selected when a
document is revised with comments during a review, or when End Activity is
selected. However, a decision code selected when a submittal is responded to
has no effect on closing PM status.

If closing status is defined via both decision code and review type, then
review type takes precedence.Â

In the Admin page, open the Workspace Settings pane and select Deliverables.
In the Activity Pick Lists tab, click on Decision Code. For available each
decision code that will be used, add a PM Status to be applied when a decision
code is applied, or select No Status Change.Â

See [ Activities Pick List ](../Admin/Workspace_Settings/Activities_pik.htm#h)
for more details.

  1. Each formal review type used in the chain will require a unique automatic distribution code for use in the distribution matrix. In the Admin page, open the Workspace Settings pane and select Manage Distribution Codes. Add a new code for each review type that will be triggered via the distribution matrix. For example: e = Digital Copy - Formal Review_External Review. 

Note  If you have already uploaded a distribution matrix for this workspace,
you cannot edit or remove existing distribution codes, only add new ones.

See [ Manage Distribution Codes ](../Admin/Workspace_Settings/Manage_d.htm#h)
for more details.

  1. Open the distribution matrix spreadsheet and create a new row. Make sure there is a column on the left hand side for the PM status field. In the bottom left quarter, in the PM Status column, enter the Closing PM status of the first review. In the bottom right quarter, enter the appropriate code for Digital Copy - Formal Review for the review type of the next review in the chain.Â 

For example, to trigger the External Review review type from the internal
reviewâs closure status of Internally_Reviewed, enter the distribution code
for Digital Copy - Formal Review_External Review plus the relevant
distribution action, for each intended recipient of the review: e/T e/C e/S.

See [ Configure the distribution matrix
](../User_Settings/Configure_the_distribution_matrix.htm#h) for more details.

To begin the formal review chain, create the first review in the normal way
(see [ Create a formal review ](Create.htm#h) ).

