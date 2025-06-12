Status configuration

Click here to see this page in full context

###  Status Configuration

Note  Available when Document Lifecycle is enabled.

The FusionLive Document Lifecycle module allows you to apply a lifecycle to
the documents in your workspace. At each stage of the lifecycle, documents are
given a Project Management (PM) status.

By default, Document Lifecycle workspaces come with a default status of New.
If document pre-registration is enabled, users can create placeholders which
can be given document content at a later date. In this case, an additional
status of Pre-register is also included. Once you have designed your
lifecycle, you can create the other required statuses.

As a simple example, consider a lifecycle for documentation production. It
consists of four stages, each of which has a status that can be applied to
documents.

![](../../images/lifecycle example.png)

In this example each successive stage of the lifecycle depends on the previous
one being completed, with the exception that after the Review status, the flow
may either go on to the Release status or go back to Draft. The allowable
choices for the lifecycle flow at each stage are:

Status  |  Description  |  Next status   
---|---|---  
New  |  New document created.Â  |  Draft   
Draft  |  Document being written.  |  Review   
Review  |  Writing complete. Document sent for review.Â Â  |  Draft   
Release  
Release  |  Document signed off for public release.  |  <lifecycle ended>  
  
Â Â Â Â Â Â  
  
Â

