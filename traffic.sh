while true; 
    do sleep 1; 
    curl --silent -X GET http://127.0.0.1:53173/search?name=Java&fake_error=true;
done

