## Setup
1. Copy the *src/main/webapp/WEB-INF/appengine-web.template.xml* to *appengine-web.xml* and fill in the environment variables.
2. Add the firebase access json to directory *src/main/resources* (must be called *CharityDiscount.json*) (this can be configured in the xml from step 1).
3. For the tests to pass, the env variables from appengine-web.xml must be defined locally (the path to the service
 file must be absolute)
4. Deploy: `mvn -q appengine:deploy`